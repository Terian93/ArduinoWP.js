import IO from 'socket.io-client';

export class ArduinoWebPort {
  private _socket: SocketIOClient.Socket;
  private conectionCallback?: (isDeployed: boolean) => void;
  constructor(uri: string) {
    this._socket =IO.connect(uri); //path
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

  constructor(event: string, socket: SocketIOClient.Socket, isDebugModeActive = false) {
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


  constructor(event: string, socket: SocketIOClient.Socket, isDebugModeActive = false) {
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
  emit(data: any) {
    this.value = this.middleware(data);
    this.socket.emit(this.event, this.value);
    this.callback(this.value);
    if ( this.debugMode ) {
      console.log("Output:" + this.event + " emited => " + this.value);
    }
    return true;
  }
}

class Sensor {
  protected core: ArduinoWebPort;
  protected event: string;
  protected _input: Input;

  constructor(
    core: ArduinoWebPort,
    event: string,
    isDebugModeActive = false
  ) {
    this.core = core;
    this.event = event;
    this._input = core.createInput(event, isDebugModeActive);
  }

  get input() {
    return this._input;
  }
}

class Actuator {
  protected core: ArduinoWebPort;
  protected event: string;
  protected _output: Output; 

  constructor(
    core: ArduinoWebPort,
    event: string,
    isDebugModeActive = false
  ) {
    this.core = core;
    this.event = event;
    this._output = core.createOutput(event, isDebugModeActive);
  }

  get output() {
    return this._output;
  }
} 


export class TemperatureSensor extends Sensor {
  private precision?: number;
  private maxLimit?: number;
  private minLimit?: number;
  private triggerAreaReturns?: boolean;
  private maxTriggerLimit?: number;
  private minTriggerLimit?: number;
  private unitParser?: (temperature: number) => number;

  constructor(core: ArduinoWebPort, event: string, isDebugModeActive = false ) {
    super(core, event);
  }

  setPercision(precision: number) {
    this.precision = precision;
    return this;
  }

  setTemperatureNumberLimit(min?: number, max?: number) {
    if (min) {
      this.minLimit = min;
    }
    if (max) {
      this.maxLimit = max;
    }
    return this;
  }

  setTriggerLimit(areaReturn = true, min?: number, max?: number) {
    if (min) {
      this.minTriggerLimit = min;
    }
    if (max) {
      this.maxTriggerLimit = max;
    }
    this.triggerAreaReturns = areaReturn;
    return this;
  }

  private changeFtoC (fahrenheitTemp: number) {
    // if (!Number.isSafeInteger(fahrenheitTemp) || !Number.isSafeInteger(celsiusTemp)) {
    //   console.warn('changeFtoC(): unsafe number');
    // }
    return (fahrenheitTemp - 32) / 1.8;
  }

  private changeCtoF (celsiusTemp: number) {
    return celsiusTemp * 1.8 + 32;
  }

  private changeCtoK (celsiusTemp: number) {
    return celsiusTemp + 273.15;
  }

  private changeKtoC (kelvinTemp: number) {
    return kelvinTemp - 273.15;
  }

  changeUnits(inputUnits: 'Celsius' | 'Fahrenheit' | 'Kelvin', outputUnits: 'Celsius' | 'Fahrenheit' | 'Kelvin') {
    if (inputUnits === 'Celsius' && outputUnits === 'Fahrenheit') {
      this.unitParser = (temp: number) => this.changeCtoF(temp);
    }

    if (inputUnits === 'Celsius' && outputUnits === 'Kelvin') {
      this.unitParser = (temp: number) => this.changeCtoK(temp);
    }

    if (inputUnits === 'Fahrenheit' && outputUnits === 'Celsius') {
      this.unitParser = (temp: number) => this.changeFtoC(temp);
    }

    if (inputUnits === 'Fahrenheit' && outputUnits === 'Kelvin') {
      this.unitParser = (temp: number) => this.changeCtoK(this.changeFtoC(temp));
    }

    if (inputUnits === 'Kelvin' && outputUnits === 'Celsius') {
      this.unitParser = (temp: number) => this.changeKtoC(temp);
    }

    if (inputUnits === 'Kelvin' && outputUnits === 'Fahrenheit') {
      this.unitParser = (temp: number) => this.changeCtoF(this.changeKtoC(temp));
    }
    return this;
  }

  deploy (middleware = (data: number) => data, callback?: (data:any) => void) {
    this._input.addMiddleware((temp) => {
      let parsedValue = parseFloat(temp);
      if (this.unitParser) {
        parsedValue = this.unitParser(parsedValue);
      }
      if(this.precision) {
        parsedValue = Math.ceil(parsedValue / this.precision) * this.precision;
      }
      if (this.maxLimit) {
        parsedValue = parsedValue > this.maxLimit ? this.maxLimit : parsedValue;
      }
      if (this.minLimit) {
        parsedValue = parsedValue < this.minLimit ? this.minLimit : parsedValue;
      }

      if (!Number.isSafeInteger(parsedValue)) {
        console.warn('unsafe number parsed in middleware');
      }

      return middleware(parsedValue);
    });

    if (callback) {
      if (this.minTriggerLimit || this.maxTriggerLimit) {
        this._input.addCallback((temp) => {
          let passedLimit = this.triggerAreaReturns;
          if ( this.minTriggerLimit && temp < this.minTriggerLimit ) {
            passedLimit = !this.triggerAreaReturns;
          }
          if ( this.maxTriggerLimit && temp > this.maxTriggerLimit ) {
            passedLimit = !this.triggerAreaReturns;
          }
          callback({passedLimit, temp});
        });
      } else {
        this._input.addCallback(callback);
      }
    }
    this._input.deploy();
    return this;
  }
}

export class Servo extends Actuator {
  private currentPosition: number;
  private twoPositionModeActive = false;
  private isOpened?: boolean;
  private closedPosition?: number;
  private openedPosition?: number;
  private continiousMode = false;
  private lastRotation?: {
    direction: 'left' | 'right' | 'stop',
    speed: number,
    time: number,
    delay: number
  };

  constructor(core: ArduinoWebPort, event: string, isDebugModeActive = false ) {
    super(core, event);
    this.currentPosition = 0;
  }

  get value() {
    if (this.twoPositionModeActive) {
      return this.isOpened;
    } else if (this.continiousMode) {
      return this.lastRotation;
    } else {
      return this.currentPosition;
    }
  }

  setCurrentPosition(deg: number) {
    if (deg < 0 || deg > 360) {
      console.warn('wrong degree number');
    } else {
      this.currentPosition = deg;
    }
  }

  setPosition(deg: number) {
    if (deg < 0 || deg > 360) {
      console.warn('wrong degree number');
    } else {
      this._output.emit(deg);
    }
  }

  disableTwoPositionMode() {
    this.twoPositionModeActive = false;
  }

  enableTwoPositionMode(closedDeg: number, openedDeg: number) {
    this.disableContiniousMode();
    if (closedDeg < 0 || closedDeg > 360 || openedDeg < 0 || openedDeg > 360) {
      console.warn('wrong degree number');
    } else {
      this.twoPositionModeActive = true;
      this.closedPosition = closedDeg;
      this.openedPosition = openedDeg;
      this.close();
    }
  }

  close() {
    if (this.twoPositionModeActive && this.closedPosition) {
      this.setPosition(this.closedPosition);
      this.isOpened = false;
    } else {
      console.warn('two position mode for Servo is unactive');
    }
  }

  open() {
    if (this.twoPositionModeActive && this.openedPosition) {
      this.setPosition(this.openedPosition);
      this.isOpened = true;
    } else {
      console.warn('two position mode for Servo is unactive');
    }
  }

  enableContiniousMode() {
    this.continiousMode = true;
    this.disableTwoPositionMode();
  }

  disableContiniousMode() {
    this.continiousMode = false;
  }

  setRotation(
    direction: 'left' | 'right' | 'stop',
    speed: number, //0 = stop, 90 = max speed
    time = 0,      //time in ms; 0 means infinite
    delay = 0      //delay in ms; 0 means instant start
  ) {
    if (!this.continiousMode) {
      console.warn('continiousMode for Servo is Disabled');
    } else {
      this.lastRotation = { direction, speed, time, delay };
      if (direction === 'stop') {
        this._output.emit('90');
      } else {
        const parsedSpeed = direction === 'left' ? 90 - speed : 90 + speed;
        this._output.emit(parsedSpeed + '::' + time + '::' + delay);
      }
    }
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