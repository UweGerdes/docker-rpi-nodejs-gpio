/*
 * Start a HTTP server for gpio led control
 *
 * node server.js
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */

'use strict';

var http = require("http").createServer(handler),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    io = require('socket.io')(http),
    Gpio = require('pigpio').Gpio;
const Led = require('./lib/led.js');
const RGBLed = require('./lib/rgbled.js'); 

let items = {};
items['LED 1'] = new Led(17, 'red', {min: 1, max: 255} );
items['LED 2'] = new Led(27, 'yellow', {min: 1, max: 255} );
items['LED 3'] = new Led(22, 'green', {min: 1, max: 51} );
items['LED 4'] = new Led(10, 'blue', {min: 1, max: 255} );
items['RGB LED 1'] = new RGBLed({ red: 23, green: 24, blue: 25});
items['RGB LED 2'] = new RGBLed({ red: 21, green: 20, blue: 16});
items['RGB LED 3'] = new RGBLed({ red: 26, green: 19, blue: 13});

/*
console.log(items['Blaue LED'].toString());
//items['Blaue LED'].onOff(500);
items['Blaue LED'].on();
console.log(items['Blaue LED'].toString());
items['Blaue LED'].blink(500);
setTimeout( items['Blaue LED'].blinkOff.bind(items['Blaue LED']) , 3300);
//items['Blaue LED'].onOff(1000);
console.log(items['Blaue LED'].toString());
*/

var servo = new Gpio(18, {mode: Gpio.OUTPUT}); //use GPIO pin 18 as output for SERVO
var pushButton = new Gpio(9, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_DOWN,
    edge: Gpio.EITHER_EDGE
  });

var servoValue = 0; //set starting value of SERVO variable to off

// all off
servo.digitalWrite(servoValue); // Turn GREEN LED off

http.listen(8080); //listen to port 8080

function handler (request, response) { //what to do on requests to port 8080
  var uri = url.parse(request.url).pathname,
      filename = path.join(process.cwd(), 'public', uri.replace(/\/$/, "/index.html"));

  var contentTypesByExtension = {
    '.html': "text/html",
    '.css':  "text/css",
    '.js':   "text/javascript"
  };

  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      var headers = {};
      var contentType = contentTypesByExtension[path.extname(filename)];
      if (contentType) {
        headers["Content-Type"] = contentType;
      }
      response.writeHead(200, headers);
      response.write(file, "binary");
      response.end();
    });
  });
}

pushButton.on('interrupt', function (value) {
  items['Gelbe LED'].digitalWrite(value); //turn LED on or off depending on the button state (0 or 1)
});

io.sockets.on('connection', function (socket) {// Web Socket Connection
  socket.emit('data', getItems() );
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
  Object.keys(items).forEach( (item) => {
    var data = items[item].getData();
    if (data.type === 'LED') {
      socket.on(item, function(data) {
        if (typeof data.pwmValue === 'string') {
          console.log('received string value: %o' + data);
        }
        items[item].pwmWrite(parseInt(data.pwmValue));
        var pwmValue = {};
        pwmValue[items[item].color] = items[item].pwmValue;
        socket.emit(item, pwmValue);
      });
    } else if (data.type === 'RGBLED') {
      socket.on(item, function(data) {
        items[item].pwmWrite( data );
        socket.emit(item, items[item].pwmValue);
      });
    }
  });
  socket.on('getData', () => {
    return getItems();
  });
});

process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);

function exitHandler() {
  Object.keys(items).forEach( (item) => {
    var data = items[item].getData();
    if (data.type === 'LED') {
      items[item].off();
    }
  });
  process.exit();
}

function getItems() {
  let result = {};
  Object.keys(items).forEach( (item) => {
    var data = items[item].getData();
    if (data.type === 'LED') {
      result[item] = data;
    } else if (data.type === 'RGBLED') {
      result[item] = data;
    }
  });
  return result;
}

