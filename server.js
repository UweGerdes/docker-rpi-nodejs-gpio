/*
 * Start a HTTP server for gpio led control
 *
 * node server.js
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */
'use strict';
var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http); //require socket.io module and pass the http object (server)
var Gpio = require('pigpio').Gpio; //include pigpio to interact with the GPIO
const Led = require('./lib/led.js'); 

let ledList = [];
var ledBlue = new Led(10, 'blue');
console.log(ledBlue.toString());
//ledBlue.onOff(500);
ledBlue.on();
console.log(ledBlue.toString());
ledBlue.blink(500);
setTimeout( ledBlue.blinkOff.bind(ledBlue) , 3300);
//ledBlue.onOff(1000);
console.log(ledBlue.toString());
ledList.push(ledBlue);

var ledRed = new Gpio(17, {mode: Gpio.OUTPUT}); //use GPIO pin 4 as output for RED
var ledYellow = new Gpio(27, {mode: Gpio.OUTPUT}); //use GPIO pin 27 as output for YELLOW
var ledGreen = new Gpio(22, {mode: Gpio.OUTPUT}); //use GPIO pin 17 as output for GREEN
var servo = new Gpio(18, {mode: Gpio.OUTPUT}); //use GPIO pin 18 as output for SERVO
var pushButton = new Gpio(9, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_DOWN,
    edge: Gpio.EITHER_EDGE
  });

var redLED = 0; //set starting value of RED variable to off
var yellowLED = 0; //set starting value of YELLOW variable to off
var greenLED = 0; //set starting value of GREEN variable to off
var servoValue = 0; //set starting value of SERVO variable to off

// all off
ledRed.digitalWrite(redLED); // Turn RED LED off
ledYellow.digitalWrite(yellowLED); // Turn YELLOW LED off
ledGreen.digitalWrite(greenLED); // Turn GREEN LED off
servo.digitalWrite(servoValue); // Turn GREEN LED off

http.listen(8080); //listen to port 8080

function handler (req, res) { //what to do on requests to port 8080
  fs.readFile(__dirname + '/public/ryg.html', function(err, data) { //read file ryg.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from ryg.html
    return res.end();
  });
}
pushButton.on('interrupt', function (value) {
  ledYellow.digitalWrite(value); //turn LED on or off depending on the button state (0 or 1)
});

io.sockets.on('connection', function (socket) {// Web Socket Connection
  socket.emit('data', getItems() );
  socket.on('rygLed', function(data) { //get light switch status from client
    //console.log(data); //output data from WebSocket connection to console

    //for common cathode LED 0 is fully off, and 255 is fully on
    redLED=parseInt(data.red);
    yellowLED=parseInt(data.yellow);
    greenLED=Math.ceil(parseInt(data.green) / 5) + 1;

    ledRed.pwmWrite(redLED); //set RED LED to specified value
    ledYellow.pwmWrite(yellowLED); //set YELLOW LED to specified value
    ledGreen.pwmWrite(greenLED); //set GREEN LED to specified value
  });
  socket.on('servo', function (data) {
    console.log(data);
    var val = parseInt(data.value);
    if (parseInt(data.value) === 0) {
      servo.digitalWrite(0);
    } else if (val >= 500 && val <= 2500) {
      servo.servoWrite(parseInt(data.value));
      setTimeout(function() {servo.digitalWrite(0);}, 800);
    }
  });
  socket.on('getData', () => {
    return 'hello world';
  });
});

process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);

function exitHandler() {
  ledRed.digitalWrite(0);
  ledYellow.digitalWrite(0);
  ledGreen.digitalWrite(0);
  process.exit();
}

function getItems() {
  let list = [];
  ledList.forEach( (item) => {
    list.push(item.getData());
  });
  return list;
}

