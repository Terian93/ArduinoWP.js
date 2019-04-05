import * as socketIO from 'socket.io';
//optional
class ArduinoWebPort {
  private socket: socketIO.Socket;
  constructor(path: string) {
    //create socket
    this.socket = io.connect('http://localhost:3000'); //path
  }

  createInput(event:any){ 
    return new Input(event, this.socket)
  }
  createOutput(){}
}

class Input {
  private event: string;
  private middleware = (data:any) => data;
  private callbacks: Array<(data:any) => void>;
  private fullListener?: (data: any) => void;
  private trigger: (data: any) => boolean;
  private socket: socketIO.Socket;
  private value: string;

  constructor(event: string, socket: socketIO.Socket) {
    this.event = event;
    this.value = '';
    this.trigger = () => true;
    this.callbacks = [];
    this.socket = socket;
  }

  addMiddleware(middleware: (data: any) => any) {
    this.middleware = middleware;
    return this;
  }
  changeMiddleware() {}
  removeMiddleware() {
    this.middleware = (data:any) => data;
  }

  addCallback(callback: (data: any) => void) {
    this.callbacks.push(callback);
    return this;
  }
  changeCallBack(callback: (data: any) => void, index: number) {}
  removeCallback(callback: (data: any) => void, index: number) {}

  addTrigger(){}
  changeTrigger(){return this.addTrigger()}
  removeTrigger(){this.trigger = () => true;}

  private createListener() {
    this.fullListener = (data) => {
      if(this.trigger(data)) {
        this.value = this.middleware(data);
        this.callbacks.forEach(fn => {
          //if fn function =>
          fn(this.value);
        })
      }
    }
  }

  deploy() {
    this.createListener();
    this.socket.on('test', this.fullListener);
    return this;
  }

  remove() {
    return this;
  }
  //+синтаксичний цукор!!!
}

// btn.addEventListener('click', function(){
//   socket.emit(event.value, message.value);
//   message.value = "";
//   event.value = "";
// });

class Output {
  constructor(parameters) {
    
  }
  //no trigger

  //deploy for output
  private emit(value: any) {
    const processedValue = this.middleware(data);
    socket.emit(this.event, processedValue);
    this.callbacks.forEach(fn => {
      //if fn function =>
      fn(processedValue);
    })
    return true
  }

  getEmitter(){
    return this.emit;
  }
}

class DS3201 {
  private precision: number;
  //get set
  public input: Input;
  public output: Output;
  
  constructor(parameters) {
    this.precision = 0.5;
    this.input = new Input(...);
    this.output = new Input(...);
  }

}

//example
const t = new DS3201();
t.input.addCallback()
module.exports = {Input, Output, DS3201, ...}