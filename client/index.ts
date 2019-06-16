import IO from 'socket.io-client';

class ArduinoWebPort {
  private _socket: SocketIOClient.Socket;
  private conectionCallback?: (isDeployed: boolean) => void;

  constructor(path: string) {
    this._socket =IO.connect(path); //path
  }

  get socket() {
    return this._socket;
  }

  createInput(event:any,debugMode =false){ 
    return new Input(event, this._socket,debugMode);
  }

  createOutput(event: any,debugMode=false){
    return new Output(event, this._socket,debugMode);
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
  private isDeployed: boolean;

  constructor(event: string, socket: SocketIOClient.Socket, isDebugModeActive:boolean ) {
    this.event = event;
    this.value = '';
    this.trigger = () => true;
    this.socket = socket;
    this.debugMode = isDebugModeActive;
    this.fullListener = (data:any) => {
      if (this.trigger(data)) {
        this.value = this.middleware(data);
        this.callback(this.value);
        if ( this.debugMode ) {
          console.log("Input:"+this.event+" => " + data);
        }
      }
    };
    this.isDeployed = false;
  }

  get currentValue() {
    return this.value;
  }

  toogleDebugMode(){
    this.debugMode = !this.debugMode;
    return this;
  }

  addMiddleware(middleware: (data: any) => any) {
    this.middleware = middleware;
    if (this.isDeployed) {
      console.warn('Changes would apply after call remove().deploy()');
    }
    return this;
  }

  changeMiddleware(middleware: (data: any) => any) {
    return this.addMiddleware(middleware);
  }

  removeMiddleware() {
    this.middleware = (data:any) => data;
    if (this.isDeployed) {
      console.warn('Changes would apply after call remove().deploy()');
    }
    return this;
  }

  addCallback(callback: (data: any) => any) {
    this.callback=callback;
    if (this.isDeployed) {
      console.warn('Changes would apply after call remove().deploy()');
    }
    return this;
  }

  changeCallBack(callback: (data: any) => any) {
    return this.addCallback(callback);
  }

  removeCallback() {
    this.callback = (data:any) => data;
    if (this.isDeployed) {
      console.warn('Changes would apply after call remove().deploy()');
    }
    return this;
  }

  addTrigger(trigger: (data:any) => any ){
    this.trigger = trigger;
    if (this.isDeployed) {
      console.warn('Changes would apply after call remove().deploy()');
    }
    return this;
  }

  changeTrigger(trigger: (data:any) => any ){
    return this.addTrigger(trigger);
  }

  removeTrigger(){
    this.trigger = () => true;
    if (this.isDeployed) {
      console.warn('Changes would apply after call remove().deploy()');
    }
    return this;
  }

  private createListener() {
    if (this.isDeployed) {
      this.remove();
      console.warn('createListener() was called when Input was deployed. (remove() called to prevent problems)');
    }
    this.fullListener = (data:any) => {
      if(this.trigger(data)) {
        this.value = this.middleware(data);
        this.callback(data);
        if ( this.debugMode ) {
          console.log("Input:" + this.event + " => " + data);
        }
      }
    };
    return this;
  }

  deploy() {
    if (!this.isDeployed) {
      this.createListener();
      this.socket.on('test', this.fullListener);
      this.isDeployed = true;
    } else {
      throw new Error('Input already deployed (call removeListener() before deploy)');
    }
    return this;
  }

  remove() {
    this.socket.off('test',this.fullListener);
    this.isDeployed = false;
    return this;
  }

  deployListener() {
    return this.deploy();    
  }

  removeListener() {
    return this.remove();
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
    this.socket = socket;
    this.debugMode = isDebugModeActive;
    this.event = event;
    this.value = "";
  }

  get currentValue() {
    return this.value;
  }

  toogleDebugMode(){
    this.debugMode = !this.debugMode;
    return this;
  }

  addMiddleware(middleware: (data: any) => any) {
    this.middleware = middleware;
    return this;
  }

  changeMiddleware(middleware: (data: any) => any) {
    return this.addMiddleware(middleware);
  }

  removeMiddleware() {
    this.middleware = (data:any) => data;
    return this;
  }

  addCallback(callback: (data: any) => any) {
    this.callback=callback;
    return this;
  }

  changeCallBack(callback: (data: any) => any) {
    return this.addCallback(callback);
  }

  removeCallback() {
    this.callback = (data:any)=>data;
    return this;
  }

  //deploy for output
  private emit(data: any) {
    this.value = this.middleware(data);
    this.socket.emit(this.event, this.value);
    this.callback(this.value);
    if ( this.debugMode ) {
      console.log("Output:" + this.event + " emited => " + this.value);
    }
    return true;
  }

  getEmitter(){
    return this.emit;
  }
}

//TODO special classes for sensors
// class DS3201 {
//   private precision: number;
//   //get set
//   public input: Input;
//   public output: Output;
  
//   constructor(parameters) {
//     this.precision = 0.5;
//     this.input = new Input(...);
//     this.output = new Output(...);
//   }

// }

//example
// const t = new DS3201();
// t.input.addCallback()
// module.exports = {Input, Output, DS3201, ...}