const express = require('express');
const SerialPort = require('serialport');
const awp = require('./build/server');

process.on('uncaughtException', err => {
  if (err.type == null) {
    err.type = 'uncaughtException';
  }
  console.log(err);
});

const app = express();
app.use(express.static('public'));
const server = app.listen(3000, function(){
  console.log('listening for requests on port 3000,');
});
const core = awp.initialize(server);
const board = core.newBoard('COM3', {baudRate: 9600}, false);
const output = board.addSocketOutput('test').setLogger(( msg, type = 'AWP' ) => msg != null ? console.log('outFirst:' + msg) : null).deploy();
const output2 = board.addSocketOutput('test').setLogger(( msg, type = 'AWP' ) => msg != null ? console.log('outSecond:' + msg) : null).deploy().remove();
const input = board.addSocketInput('test').setLogger(( msg, type = 'AWP' ) => msg != null ? console.log('inFirst:' + msg) : null).deploy();
const input2 = board.addSocketInput('test').setLogger(( msg, type = 'AWP' ) => msg != null ? console.log('inSecond:' + msg) : null).deploy().remove();


