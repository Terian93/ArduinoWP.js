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

  //TODO: 
  // private parseInput(
  //   data: any, 
  //   direction: 'input' | 'output' | 'both',
  //   callback: (data: any, event: string) => void
  // ) {
  //   switch (direction) {
  //     case 'input':
        
  //       break;

  //     case 'output':
        
  //       break;

  //     default:
  //       break;
  //   }
  // }

  // dataBaseLogger(
  //   direction: 'input' | 'output' | 'both',
  //   event: 'all' | string,
  //   callback: (data: any, event: string) => void,
  // ) {
  //   if (event === 'all') {
  //     this.socketIO.on('*', (event: string, data:any) => {
  //       callback(data, event);
  //     });
  //   } else {
  //     this.socketIO.on(event, (data: any) => {
  //       callback(data, event);
  //     });
  //   }
    
  // }

}

class Input {
  private board: Board;
  private inputName: string;
  private middleware = (data: any) => data;
  private listener: (data: any) => void;
  private callback?: (data: any) => void;
  private fullListener: (data: any) => void;
  private isDeployed = false;

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
    if (this.isDeployed) {
      this.board.logger('warning: middleware was changed when input event was not removed (remove() was auto called)');
      this.remove();
    }
    this.middleware = middleware;
    return this;
  }

  addCallback(callback: (data: any) => void) {
    if (this.isDeployed) {
      this.board.logger('warning: callback was changed when input event was not removed (remove() was auto called)');
      this.remove();
    }
    this.callback = callback;
    return this;
  }

  remove() {
    this.board.socketIO.sockets.removeListener(this.inputName, this.fullListener);
    this.isDeployed = false;
    return this;
  }

  deploy() {
    if (this.isDeployed) {
      this.board.logger('warning: deploy was called when input event was not removed (remove() was auto called)');
      this.remove();
    }
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
    this.board.socketIO.on('connection', socket => {
      socket.on(this.inputName, this.fullListener);
    });
    return this;
  }
}

export const initialize = (server: Server) => new ArduinoWebPort(server);
