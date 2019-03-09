// Make connection
var socket = io.connect('http://localhost:3000');

// Query DOM
var message = document.getElementById('message'),
  event = document.getElementById('event'),
  btn = document.getElementById('send'),
  output = document.getElementById('output');

// Emit events
btn.addEventListener('click', function(){
  socket.emit(event.value, message.value);
  message.value = "";
  event.value = "";
});

// Listen for events
socket.on('test', function(data){
  output.innerHTML += '<p>' + data + '</p>';
});