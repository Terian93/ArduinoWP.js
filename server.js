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
const server = app.listen(3000, function(){
  console.log('listening for requests on port 3000,');
});
const core = awp.initialize(server);
const board = core.newBoard('COM3', {baudRate: 9600});
function test() {
  console.log('yay');
}
board.whenPortOpened(test);