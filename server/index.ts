import * as SerialPort from 'serialport';
import * as socketIO from 'socket.io';
import { Server } from 'https';

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
  private socketIO: SocketIO.Server;
  private serialPortPath: string;
  private port: SerialPort;
  private parser: SerialPort.parsers.Readline;
  private logger = (msg:Error | null | undefined | string, type = 'AWP') => msg != null ? console.log('logger:' + msg) : null;

  constructor (
    socket: SocketIO.Server, 
    path:string, 
    portOptions: SerialPort.OpenOptions
  ) {
    this.socketIO = socket;
    this.serialPortPath = path;
    this.port = new SerialPort(path, portOptions, this.logger);
    this.parser = this.port.pipe(new SerialPort.parsers.Readline({ delimiter: '\n' }));
    this.port.on('open', () => this.logger('AWP: serial port '+ path +' opened'));
  }

  destructor() {
    this.port.close();
    this.logger('AWP: destructor called in Board ' + this.serialPortPath);
  }

  isPortOpened() {
    return this.port.isOpen;
  }

  whenPortOpened(callback: () => void) {
    this.port.on('open', callback);
  }

  setLogger(logger: (msg:Error | null | undefined | string, type?: string) => void) {
    this.logger = logger;
  }

  addSocketOutput(outputName: string) {
    this.parser.on('data', rawData => {
      const [dataIdentifier, data] = rawData.split('/AWP-output/');
      if ( dataIdentifier === outputName) {
        this.logger(
          this.serialPortPath + ' -[' + outputName + ']-> ' + rawData,
          'AWP-output'
        );
        this.socketIO.emit(outputName, data);
      }
    });
  }
  addSocketInput(inputName: string) {
    this.socketIO.on('connection', socket => {
      socket.on(inputName, data => {
        const editedData = inputName + '/AWP-input/' + data;
        this.parser.write( editedData + '\n', err => this.logger);
        this.logger(
          this.serialPortPath + 
          ' <-[' + inputName + ']- ' +
          editedData
        );
      });
    });
  }
}

export const initialize = (server: Server) => new ArduinoWebPort(server);
