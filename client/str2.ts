import { emit } from "cluster";

class awp {
  newInput() {
    return new Input();
  }
  //newOutput
}

//main clases

class IO {} //optional

class Input {

  private callbacks = [];

  constructor(nazva: string) {

  }
  //return this;!!!
  addMiddleware() {}
  addCallback() {}
  addTrigger(equal, notEqual, {min, max} ) {
    this.trigger = (data) => true|false 
  }
  deploy() {
    // data => mid1(data) => mid2(mid1Data) => callbacks.forEach(callback(parsedData))
    this.listener = (data) => {
      if (this.trigger) {
        const parsedData = packageMiddleware(data); // data => mid1() => mid2() => parsedData
        this.callbacks.forEach(callback => callback(parsedData));
      }
    }
    socket.on('test', listener);
    
  }
  remove() {
    //stops Input socket
    socket.removeListener('test', this.listener);
  }
}

class sensor extends Input {}

class Output {
  addMiddleware()
  addCallback()
  addTrigger(equal, notEqual, {min, max} ) {
    this.trigger = (data) => true|false 
  }
  emit(data) {
    const parsedData = middleware(data);
    socket.emit('test', parsedData);
    this.callbacks.forEach(callback => callback(parsedData));
  }
}

class servo extends Intput {
  constructor (...param) {
    this.output = new Output;

  }
}