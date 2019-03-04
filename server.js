const express = require('express');
const SerialPort = require('serialport');
const awp = require('./build/server');

const app = express();
const server = app.listen(3000, function(){
  console.log('listening for requests on port 3000,');
});
const core = awp.initialize(server);
const board = core.newBoard('COM3', {baudRate: 9600});
const first = board.isOpened('first');
const second = board.isOpened('second');