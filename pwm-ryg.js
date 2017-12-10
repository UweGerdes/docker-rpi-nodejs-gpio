'use strict';
var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http); //require socket.io module and pass the http object (server)
var Gpio = require('pigpio').Gpio; //include pigpio to interact with the GPIO

var ledRed = new Gpio(4, {mode: Gpio.OUTPUT}); //use GPIO pin 4 as output for RED
var ledYellow = new Gpio(22, {mode: Gpio.OUTPUT}); //use GPIO pin 27 as output for YELLOW
var ledGreen = new Gpio(11, {mode: Gpio.OUTPUT}); //use GPIO pin 17 as output for GREEN
var redRGB = 0; //set starting value of RED variable to off
var yellowRGB = 0; //set starting value of YELLOW variable to off
var greenRGB = 0; //set starting value of GREEN variable to off

//RESET RGB LED
ledRed.digitalWrite(0); // Turn RED LED off
ledYellow.digitalWrite(0); // Turn YELLOW LED off
ledGreen.digitalWrite(0); // Turn GREEN LED off

http.listen(8080); //listen to port 8080

function handler (req, res) { //what to do on requests to port 8080
  fs.readFile(__dirname + '/public/rgb.html', function(err, data) { //read file rgb.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from rgb.html
    return res.end();
  });
}

io.sockets.on('connection', function (socket) {// Web Socket Connection
  socket.on('rgbLed', function(data) { //get light switch status from client
    console.log(data); //output data from WebSocket connection to console

    //for common cathode RGB LED 0 is fully off, and 255 is fully on
    redRGB=parseInt(data.red);
    yellowRGB=parseInt(data.yellow);
    greenRGB=parseInt(data.green);

    ledRed.pwmWrite(redRGB); //set RED LED to specified value
    ledYellow.pwmWrite(yellowRGB); //set YELLOW LED to specified value
    ledGreen.pwmWrite(greenRGB); //set GREEN LED to specified value
  });
});

process.on('SIGINT', function () { //on ctrl+c
  ledRed.digitalWrite(0); // Turn RED LED off
  ledYellow.digitalWrite(0); // Turn YELLOW LED off
  ledGreen.digitalWrite(0); // Turn GREEN LED off
  process.exit(); //exit completely
});

