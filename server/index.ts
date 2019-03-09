import * as SerialPort from 'serialport';
import * as socketIO from 'socket.io';
import { Server } from 'https';

class ArduinoWebPort {
  private socket: SocketIO.Server;
  private boards: { [name: string]: Board };
  private _logger = ( msg:Error | null | undefined | string, type = 'AWP' ) => msg != null ? console.log('logger:' + msg) : null;

  constructor (server: Server, strict = true)  {
    this.socket = socketIO(server);
    this.boards = {};
  }

  test() {
    this.logger('anyText');
  }

  get logger () {
    return this._logger;
  }

  set logger ( func: (msg:Error | null | undefined | string, type?: string) => void ) {
    this._logger = func;
  }

  setLogger( func: (msg:Error | null | undefined | string, type?: string) => void ) {
    this._logger = func;
  }

  newBoard(path:string, portOptions: SerialPort.OpenOptions, isStrict: boolean) {
    if (!this.boards.hasOwnProperty(path)) {
      this.boards[path] = new Board(this.socket, path, portOptions, this, isStrict);
    } else {
      this.logger('warning: board already exists, returning existing board');
    }
    return this.boards[path];
  }
}

class Board {
  private _socketIO: SocketIO.Server;
  private _serialPortPath: string;
  private _port: SerialPort;
  private _parser: SerialPort.parsers.Readline;
  private core: ArduinoWebPort;
  private io: {[name: string]:{input?: Input, output?: Output}}; //change i/o type to clasess
  private _logger: ( msg:Error | null | undefined | string, type?: string ) => void;
  private _isStrict: boolean;

  constructor (
    socket: SocketIO.Server, 
    path:string, 
    portOptions: SerialPort.OpenOptions,
    core: ArduinoWebPort,
    strict: boolean
  ) {
    this.core = core;
    this. _logger = (msg:Error | null | undefined | string, type?: string ) => this.core.logger(msg, type);
    this._socketIO = socket;
    this._serialPortPath = path;
    this._port = new SerialPort(path, portOptions, (data) => this.logger(data));
    this._parser = this.serialPort.pipe(new SerialPort.parsers.Readline({ delimiter: '\n' }));
    this.serialPort.on('open', () => this.logger('AWP: serial port '+ path +' opened'));
    this._isStrict = strict;
    this.io = {};
  }

  destructor() {
    this.serialPort.close();
    this.socketIO.sockets.removeAllListeners();
    this._logger('AWP: destructor called in Board ' + this.serialPortPath);
  }

  test(inputName: string) {
    return this.io[inputName].input;
  }

  isPortOpened() {
    return this.serialPort.isOpen;
  }

  whenPortOpened(callback: () => void) {
    this.serialPort.on('open', callback);
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

  get isStrict() {
    return this._isStrict;
  }
  //#endregion

  set logger( func: (msg:Error | null | undefined | string, type?: string) => void ) {
    this._logger = func;
  }

  setLogger( func: (msg:Error | null | undefined | string, type?: string) => void ) {
    this._logger = func;
  }

  addSocketOutput(outputName: string, middleware = (data:any) => data) {
    if (this.isStrict) {
      if (this.io.hasOwnProperty(outputName) && this.io[outputName].hasOwnProperty('output')) {
        this.logger('warning: output already exists (returning existing Output)');
      } else {
        this.io[outputName] = {
          ...this.io[outputName],
          output: new Output(outputName, this)
        };
      }
      return this.io[outputName].input;
    } else {
      return new Output(outputName, this);
    }
  }

  addSocketInput(inputName: string) {
    if (this.isStrict) {
      if (this.io.hasOwnProperty(inputName) && this.io[inputName].hasOwnProperty('input')) {
        this.logger('warning: input already exists (returning existing Input)');
      } else {
        this.io[inputName] = {
          ...this.io[inputName],
          input: new Input(inputName, this)
        };
      }
      return this.io[inputName].input;
    } else {
      return new Input(inputName, this);
    }
  }
}

class Node {

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
  private _logger: ( msg:Error | null | undefined | string, type?: string ) => void;

  constructor(inputName: string, board: Board) {
    this.board = board;
    this.inputName = inputName;
    this. _logger = (msg:Error | null | undefined | string, type?: string ) => this.board.logger(msg, type);
    this.listener = (data:any) => {
      const editedData = inputName + '/AWP-input/' + data;
      this.board.serialParser.write( editedData + '\n', this.logger);
      this.logger(
        this.board.serialPortPath + 
        ' <-[' + inputName + ']- ' +
        editedData
      );
    };
    this.fullListener = this.listener;
  }

  test(data: any) {
    this.logger(data);
  }

  get logger() {
    return this._logger;
  }

  set logger( func: (msg:Error | null | undefined | string, type?: string) => void ) {
    this._logger = func;
  }

  setLogger( func: (msg:Error | null | undefined | string, type?: string) => void ) {
    this._logger = func;
    return this;
  }

  addMiddleware(middleware: (data: any) => any) {
    this.middleware = middleware;
    this.fullListener = (data: any) => {
      const parsedData = this.middleware(data);
      this.listener(parsedData);
      if (this.callback !== undefined) {
        this.callback(parsedData);
      }
    };
    return this;
  }

  addCallback(callback: (data: any) => void) {
    this.callback = callback;
    this.fullListener = (data: any) => {
      const parsedData = this.middleware(data);
      this.listener(parsedData);
      if (this.callback !== undefined) {
        this.callback(parsedData);
      }
    };
    return this;
  }

  changeMiddleware(middleware: (data: any) => any) {
    return this.addMiddleware(middleware);
  }

  changeCallback(callback: (data: any) => void) {
    return this.addCallback(callback);
  }

  getListener() {
    return this.fullListener;
  }

  remove() {
    if (this.isDeployed && this.connection !== undefined) {
      this.connection.removeAllListeners();
      this.isDeployed = false;
      this.logger('input ' + this.inputName + ' on board ' + this.board.serialPortPath + ' was removed');
    }
    return this;
  }

  deploy() {
    if (this.isDeployed) {
      this.logger('warning: deploy was called when it\'s already deployed (execution stoped)');
    } else {
      this.isDeployed = true;
      this.connection = this.board.socketIO.on('connection', socket => {
        socket.on(this.inputName, this.fullListener);
      });
      this.logger('input ' + this.inputName + ' on board ' + this.board.serialPortPath + ' was deployed');
    }
    return this;
  }

  deployListener() {
    return this.deploy();
  }

  removeListener() {
    return this.remove();
  }
}

class Output {
  private board: Board;
  private outputName: string;
  private middleware = (data: any) => data;
  private listener: (data: any) => void;
  private callback?: (data: any) => void;
  private fullListener: (data: any) => void;
  private isDeployed = false;
  private connection?: SerialPort.parsers.Readline;
  private _logger: ( msg:Error | null | undefined | string, type?: string ) => void;

  constructor(outputName: string, board: Board) {
    this.board = board;
    this.outputName = outputName;
    this. _logger = (msg:Error | null | undefined | string, type?: string ) => this.board.logger(msg, type);
    this.listener = (data:any) => {
      const editedData = outputName + '/AWP-output/' + data;
      this.board.socketIO.emit(outputName, editedData);
      this.logger(
        this.board.serialPortPath + ' -[' + outputName + ']-> ' + data
      );
    };
    this.fullListener = this.listener;
  }

  test(data: any) {
    this.logger(data);
  }

  get logger() {
    return this._logger;
  }

  set logger( func: (msg:Error | null | undefined | string, type?: string) => void ) {
    this._logger = func;
  }

  setLogger( func: (msg:Error | null | undefined | string, type?: string) => void ) {
    this._logger = func;
    return this;
  }

  addMiddleware(middleware: (data: any) => any) {
    this.middleware = middleware;
    this.fullListener = (data: any) => {
      const parsedData = this.middleware(data);
      this.listener(parsedData);
      if (this.callback !== undefined) {
        this.callback(parsedData);
      }
    };
    return this;
  }

  addCallback(callback: (data: any) => void) {
    this.callback = callback;
    this.fullListener = (data: any) => {
      const parsedData = this.middleware(data);
      this.listener(parsedData);
      if (this.callback !== undefined) {
        this.callback(parsedData);
      }
    };
    return this;
  }

  changeMiddleware(middleware: (data: any) => any) {
    return this.addMiddleware(middleware);
  }

  changeCallback(callback: (data: any) => void) {
    return this.addCallback(callback);
  }

  getListener() {
    return this.fullListener;
  }

  remove() {
    if (this.isDeployed && this.connection !== undefined) {
      this.connection.removeAllListeners();
      this.isDeployed = false;
      this.logger('input ' + this.outputName + ' on board ' + this.board.serialPortPath + ' was removed');
    }
    return this;
  }

  deploy() {
    if (this.isDeployed) {
      this.logger('warning: deploy was called when it\'s already deployed (execution stoped)');
    } else {
      this.isDeployed = true;
      this.connection = this.board.serialParser.on('data', rawData => {
        const [dataIdentifier, data] = rawData.split('/AWP-output/');
        if ( dataIdentifier === this.outputName) {
          this.fullListener(data);
        }
      });
      this.logger('input ' + this.outputName + ' on board ' + this.board.serialPortPath + ' was deployed');
    }
    return this;
  }

  deployListener() {
    return this.deploy();
  }

  removeListener() {
    return this.remove();
  }

}

export const initialize = (server: Server) => new ArduinoWebPort(server);
