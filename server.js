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
const input1 = board.addSocketInput('test').setLogger((msg, type = 'AWP' ) => msg != null ? console.log('first:' + msg) : null).deploy().remove();
const input2 = board.addSocketInput('test');
input2.setLogger((msg, type = 'AWP' ) => msg != null ? console.log('second:' + msg) : null);
input2.deploy();


