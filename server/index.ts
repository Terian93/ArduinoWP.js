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
  private socket: SocketIO.Server;
  private serialPortPath: string;
  private port: SerialPort;
  private parser: SerialPort.parsers.Readline;
  private logger = (msg:Error | string) => msg != null ? console.log('logger:' + msg) : null;

  constructor (
    socket: SocketIO.Server, 
    path:string, 
    portOptions: SerialPort.OpenOptions
  ) {
    this.socket = socket;
    this.serialPortPath = path;
    this.port = new SerialPort(path, portOptions, (err) => this.logger(err));
    this.parser = this.port.pipe(new SerialPort.parsers.Readline({ delimiter: '\n' }));
    this.port.on('open', () => {
      console.log('AWP: serial port '+ path +' opened');
    });
  }

  destructor() {
    this.port.close();
  }

  isPortOpened() {
    return this.port.isOpen;
  }

  whenPortOpened(callback: () => void) {
    this.port.on('open', callback);
  }

  setLogger(logger: (msg: Error | string) => void) {
    this.logger = logger;
  }
}

export const initialize = (server: Server) => new ArduinoWebPort(server);


// export class ArduinoWebPort {
//   private port: SerialPort;
//   private parser: SerialPort.parsers.Readline;
//   private socket;
//   private events = {};

//   constructor(serialPort: SerialPort, socket) {
//     this.port = serialPort;
//     this.parser = this.port.pipe(new SerialPort.parsers.Readline({ delimiter: '\n' }));
//     this.port.on('open', data => {
//       console.log('serial port opened');
//     });

//   }

//   destructor() {
//     try {
//       //TODO: map close all listeners
//       this.port.close();
//     } catch (error) {
//       console.log(error);
//     }
//   }

//   newArduinoListener(name: string, listenable: boolean, func?: Function) {
//     if (this.events.hasOwnProperty(name)) {
//       console.log(name + ' already exists, newArduinoEvent() stoped');
//     } else {
//       if (listenable) {

//       }
//       this.events[name] = this.parser.on('data', data => func(data));
//     }
//   }
// }