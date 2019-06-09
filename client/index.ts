import * as socketIO from 'socket.io'; 
class ArduinoWebPort {
  private socket: socketIO.Socket;
  constructor(path: string) {
    //create socket
    this.socket = io.connect('http://localhost:3000'); //path
  }

  createInput(event:any){ 
    return new Input(event, this.socket)
  }
  createOutput(event: any){
    return new Output(event, this.socket)
  }
}

//TODO debugMode
class Input {
  private debugMode: boolean;
  private event: string;
  private middleware = (data:any) => data;
  private callbacks: Array<(data:any) => void>;
  private fullListener?: (data: any) => void;
  private trigger: (data: any) => boolean;
  private socket: socketIO.Socket;
  private value: string;

  constructor(event: string, socket: socketIO.Socket, isDebugModeActive = false) {
    this.event = event;
    this.value = '';
    this.trigger = () => true;
    this.callbacks = [];
    this.socket = socket;
    this.debugMode = isDebugModeActive;
  }
  //TODO
  // toogleDebugMode(){
  //   this.isDebugMode != this.isDebugMode;
  //   return this;
  // }

  addMiddleware(middleware: (data: any) => any) {
    this.middleware = middleware;
    return this;
  }
  changeMiddleware(middleware: (data: any) => any) {
    return this.addMiddleware(middleware);
  }
  removeMiddleware() {
    this.middleware = (data:any) => data;
    if ( this.debugMode ) {
      //TODO
      //console.log(input\output + eventName + action);
    }
  }

  addCallback(callback: (data: any) => void) {
    this.callbacks.push(callback);
    return this;
  }
  changeCallBack(callback: (data: any) => void, index: number) {
    return this.addCallback(callback);
  }
  removeCallback(callback: (data: any) => void, index: number) {
    this.callback = (data:any)=>data;
    if(this.debugMode) {
      //.........
    }
  }

  addTrigger(trigger: (data:any) => any ){
    this.trigger=trigger;
    return this;
  }
  changeTrigger(trigger: (data:any) => any ){
    return this.addTrigger(trigger);
  }
  removeTrigger(){
    this.trigger = () => true;
  }

  private createListener() {
    this.remove();
    this.fullListener = (data) => {
      if(this.trigger(data)) {
        this.value = this.middleware(data);
        this.callbacks.forEach(fn => {
          fn(this.value);
        });
      }
    };
  }

  deploy() {
    this.createListener();
    this.socket.on('test', this.fullListener); //TODO fix data type
    return this;
  }

  remove() {
                                          //TODO: add feature to stop socket.on() event listener
    this.socket.removeAllListeners('test');//CHECK+++++++++++++++++++++++++++++++++++++++++
    return this;
  }
  
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
    });
    return true;
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
    this.output = new Output(...);
  }

}

//example
const t = new DS3201();
t.input.addCallback()
module.exports = {Input, Output, DS3201, ...}