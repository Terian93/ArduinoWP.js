# ArduinoWP.js (WIP):construction:
Arduino Web Port - fast &amp; simple arduino-server-client connection library
## Idea
Create library that can:
* server side
  * create listener of serialport using [node serialport](https://serialport.io/en/)
  * stream data from arduino board by serial port to client using [socket.io](https://socket.io) 
  * log data to data base with HOC's
  * listen to response from client on stream and send data to arduino board based on sent data
* client side
  * trigger function when input data are valid to limits (with HOC's too)
  * parse data in prefered units
  * special methods for sensors
## Reasons
1. Create fast & easy connection arduino-server-client
2. Me and my friend need dyploma project to graduate :smirk:
