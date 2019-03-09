import { Socket } from "dgram";
import { triggerAsyncId } from "async_hooks";
import { listenerCount } from "cluster";
import { callbackify } from "util";

class Port() //server connection
{
  new Input
    Sensor extends Input
    setTrigger();
    setMiddleware();
    setCallback();
    Socket.on('event' (data) => {})
  new Output
    private middleware = (data) => data;
    private callback?: (data) => void;
    constructor() {
      send = sendData
    }

    setMiddleware()
    setCallback()
    send(data) {
      const parsed = middleware(data); (data) => data
      sendData(parsed);
      callback(parsed); //if !undefined
    }
};

class Input {
  setTrigger(equality: any, {min=-Infinity, max=Infinity}) {
    this.trigger = (data: any) => {
      if (equality !== null) {
        data === equality ? func() : null;
      } else {

      }
    }
    return this;
  }
//1 variant
if(trigger()) {} // data === equality ? true : false;
//2 variant
trigger(func()) //data === equality ? func() : null;

}

class DS3201 extends Input {
  private units = 'celsius';
  changeUnits(units: 'celsius' || 'farenheit' || 'kelvin') {
    setMiddleware(
      data => data + 234
    )
    return this;
  }

  setPohrishnist() {
    return this;
  }

}

const input = new Input('name') //this.listener this.fullListener=this.listener
.setMiddleware() //this.middleware this.fullListener
.method()
.method()
.deploy() // socket.on('test', this.listener);



//1 variant
this.listener = ...
setMiddleware(middleware: function)  
  this.listener = (data) => { //newListener
    const parsedData = middleware(data)
    this.listener(parsedData); //oldListener
  }

setCallback(callback: function)  
  this.listener = (data) => { //newListener
    this.listener(data); //oldListener
    callback(data);
  }

//2 variant (treba podumaty)
functions []
setMiddleware(middleware: function)  [...] => [mid, ...] 
  functions.unshift(middleware);
setCallback(callback: function)   [...] => [ ..., call]
  functions.push(callback);

function.forEach(element => {
  element()
});
Input
.setCallback(1)       data => call1()
.setMiddleware(1)     data => mid1() -> parsedData2 => call1()
.setMiddleware(2)     data => mid2() -> parsedData => mid1() -> parsedData2 => call1()
.setCallback(2)       data => mid2() -> parsedData => mid1() -> parsedData2 => call1(parsedData2) => call2(parsedData2)


//miy variant
this.fullListener = (data) => { 
  parsedData = middleware(data)
  listener(parsedData);
  callback(parsedData);
}

socket.on('test', this.fullListener);
