import * as SerialPort from 'serialport';
import * as socketIO from 'socket.io';
import { Server } from 'https';
import { strict } from 'assert';

class ArduinoWebPort {
  socket: SocketIO.Server;

  constructor (server: Server)  {
    this.socket = socketIO(server);
  }

  newBoard(path:string, portOptions: SerialPort.OpenOptions) {
    return new Board(this.socket, path, portOptions);
  }
}

class Board {
  private _socketIO: SocketIO.Server;
  private _serialPortPath: string;
  private _port: SerialPort;
  private _parser: SerialPort.parsers.Readline;
  private _logger = (msg:Error | null | undefined | string, type = 'AWP') => msg != null ? console.log('logger:' + msg) : null;

  constructor (
    socket: SocketIO.Server, 
    path:string, 
    portOptions: SerialPort.OpenOptions
  ) {
    this._socketIO = socket;
    this._serialPortPath = path;
    this._port = new SerialPort(path, portOptions, this.logger);
    this._parser = this.serialPort.pipe(new SerialPort.parsers.Readline({ delimiter: '\n' }));
    this.serialPort.on('open', () => this.logger('AWP: serial port '+ path +' opened'));
  }

  destructor() {
    this.serialPort.close();
    this.socketIO.sockets.removeAllListeners();
    this._logger('AWP: destructor called in Board ' + this.serialPortPath);
  }

  isPortOpened() {
    return this.serialPort.isOpen;
  }

  whenPortOpened(callback: () => void) {
    this.serialPort.on('open', callback);
  }

  //Setters
  set logger(logger: (msg:Error | null | undefined | string, type?: string) => void) {
    this._logger = logger;
  }

  //#region Getters
  get logger() {
    return this._logger;
  }

  get socketIO() {
    return this._socketIO;
  }

  get serialPort() {
    return this._port;
  }

  get serialParser() {
    return this._parser;
  }

  get serialPortPath() {
    return this._serialPortPath;
  }
  //#endregion

  //TODO: add [...functions].forEach(data => function(data))
  // to minimize event usage; (optional)

  addSocketOutput(outputName: string, middleware = (data:any) => data) {
    const test = this.serialParser.on('data', rawData => {
      const [dataIdentifier, data] = rawData.split('/AWP-output/');
      if ( dataIdentifier === outputName) {
        const parsedData = middleware(data); 
        this.logger(
          data === parsedData 
            ? this.serialPortPath + ' -[' + outputName + ']-> ' + rawData
            : this.serialPortPath + ' -[' + outputName + ']-> ' + rawData + '(' + parsedData + ')',
          'AWP-output'
        );
        this.socketIO.emit(outputName, parsedData);
      }
    });
    test.end();
  }
  addSocketInput(inputName: string) {
    return new Input(inputName, this);
  }
}

class Input {
  private board: Board;
  private inputName: string;
  private middleware = (data: any) => data;
  private listener: (data: any) => void;
  private callback?: (data: any) => void;
  private fullListener: (data: any) => void;
  private isDeployed = false;
  private connection?: SocketIO.Namespace;

  constructor(inputName: string, board: Board) {
    this.board = board;
    this.inputName = inputName;

    this.listener = (data:any) => {
      const editedData = inputName + '/AWP-input/' + data;
      this.board.serialParser.write( '' + '\n', this.board.logger);
      this.board.logger(
        this.board.serialPortPath + 
        ' <-[' + inputName + ']- ' +
        editedData
      );
      return true;
    };
    this.fullListener = this.listener;
  }

  addMiddleware(middleware: (data: any) => any) {
    this.middleware = middleware;
    return this;
  }

  addCallback(callback: (data: any) => void) {
    this.callback = callback;
    return this;
  }

  changeMiddleware(middleware: (data: any) => any) {
    return this.addMiddleware(middleware);
  }

  changeCallback(callback: (data: any) => void) {
    return this.addCallback(callback);
  }

  remove() {
    if (this.isDeployed && this.connection !== undefined) {
      this.connection.removeAllListeners();
      this.isDeployed = false;
      this.board.logger('input ' + this.inputName + ' on board ' + this.board.serialPortPath + ' was removed');
    }
    return this;
  }

  deploy() {
    if (this.isDeployed) {
      this.board.logger('warning: deploy was called when it\'s already deployed (execution stoped)');
    } else {
      this.isDeployed = true;
      if (this.middleware !== undefined || this.callback !== undefined) {
        this.fullListener = (data: any) => {
          const parsedData = this.middleware(data);
          this.listener(parsedData);
          if (this.callback !== undefined) {
            this.callback(parsedData);
          }
        };
      }
      this.connection = this.board.socketIO.on('connection', socket => {
        socket.on(this.inputName, this.fullListener);
      });
      this.board.logger('input ' + this.inputName + ' on board ' + this.board.serialPortPath + ' was deployed');
    }
    return this;
  }
}

export const initialize = (server: Server) => new ArduinoWebPort(server);
