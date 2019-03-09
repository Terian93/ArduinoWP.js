import * as io from 'socket.io-client';
const socket = io('');
socket.on('test', (data: any) => console.log(data));
const listener = (data: any) => console.log(data);
socket.on('test', listener);
socket.removeListener('test', listener);

class Test {
  protected color: string;

  constructor(color: string) {
    this.color = color;
  }

  getColor(foo = 'test') {
    return this.color;
  }
}

class Child extends Test {
  private _shape: string;
  private host = 'host';

  constructor(color: string) {
    super(color);
    this._shape = '';
    this.host = color;
  }

  set shape(shape: string) {
    this._shape = shape;
  }

  get shape() {
    return this._shape;
  }

  save() {
    return this;
  }
}

const foo = new Child('test');
const foo2 = new Child('test');

//getColor(foo = 'test')
foo.getColor(); //foo = 'test'
foo.getColor('err'); //foo = 'err' 


foo.save().getColor();

foo.save();
foo.getColor();