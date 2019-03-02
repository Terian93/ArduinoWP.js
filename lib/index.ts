import * as SerialPort from 'serialport';

export class ArduinoWebPort {
  port: SerialPort;
  parser: SerialPort.parsers.Readline;
  portOpened = false;

  constructor(path: string, options?:SerialPort.OpenOptions) {
    this.port = new SerialPort(path, options);
    this.parser = this.port.pipe(new SerialPort.parsers.Readline({ delimiter: '\n' }));
    this.port.on('open', data => {
      this.portOpened = true;
      console.log('serial port ' + path + ' opened');
    });
  }
}