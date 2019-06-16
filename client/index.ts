import IO from 'socket.io-client';
//const socketIO = require('socket.io-client');
import * as socketIO from 'socket.io-client';
class ArduinoWebPort {
  private socket: SocketIOClient.Socket;
  constructor(path: string) {
    //create socket
    this.socket =IO.connect('http://localhost:3000'); //path
  }

  createInput(event:any,debugMode =false){ 
    return new Input(event, this.socket,debugMode);
  }
  createOutput(event: any,debugMode=false){
    return new Output(event, this.socket,debugMode);
  }
}

class Input {
  private debugMode: boolean;
  private event: string;
  private middleware = (data:any) => data;
  private callback = (data:any) => null;
  private fullListener: (data: any) => void;
  private trigger: (data: any) => boolean;
  private socket: SocketIOClient.Socket;
  private value: string;

  constructor(event: string, socket: SocketIOClient.Socket, isDebugModeActive:boolean ) {
    this.event = event;
    this.value = '';
    this.trigger = () => true;
    this.socket = socket;
    this.debugMode = isDebugModeActive;
    this.fullListener = (data:any) => {
      if(this.trigger(data)) {
        this.value = this.middleware(data);
        this.callback(data);
      }
    };
  }
  toogleDebugMode(){
    this.debugMode = !this.debugMode;
    return this;
  }

  addMiddleware(middleware: (data: any) => any) {
    this.middleware = middleware;
    if(this.debugMode){
    console.log("Input:"+this.event+" addMidlleware()");
    }
    return this;
  }
  changeMiddleware(middleware: (data: any) => any) {
    return this.addMiddleware(middleware);
  }
  removeMiddleware() {
    this.middleware = (data:any) => data;
    if ( this.debugMode ) {

      console.log("Input:"+this.event+" removeMidlleware()");
    }
  }

  addCallback(callback: (data: any) => any) {
    this.callback=callback;
    return this;
  }
  changeCallBack(callback: (data: any) => any, index: number) {
    return this.addCallback(callback);
  }
  removeCallback(callback: (data: any) => any, index: number) {
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
    this.fullListener = (data:any) => {
      if(this.trigger(data)) {
        this.value = this.middleware(data);
        this.callback(data);
      }
    };
  }

  deploy() {
    this.createListener();
    this.socket.on('test', this.fullListener); //TODO fix data type
    return this;
  }

  remove() {
    this.socket.off('test',this.fullListener);
    return this;
  }
  
}

//btn.addEventListener('click', function(){
//   socket.emit(event.value, message.value);
//   message.value = "";
//   event.value = "";
//});

class Output {
  //#region Parametrs 
  private socket: SocketIOClient.Socket;
  private debugMode: boolean;
  private event: string;
  private middleware = (data:any) => data;
  private callback = (data:any) => null;
  private fullListener?: (data: any) => void;
  private value: string;
  //#endregion


  constructor(event: string, socket: SocketIOClient.Socket, isDebugModeActive :boolean) {
      this.socket= socket;
      this.debugMode=isDebugModeActive;
      this.event=event;
      this.value="";
    }

  //deploy for output
  private emit(value: any) {
    const processedValue = this.middleware(value);
    this.socket.emit(this.event, processedValue);
    this.callback(value);
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