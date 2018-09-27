/*
 * Start a HTTP server for gpio led control
 *
 * node server.js
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */

'use strict';

var http = require('http').createServer(handler),
    path = require('path'),
    fs = require('fs'),
    os = require('os'),
    io = require('socket.io')(http),
    url = require('url');

var serverPort = process.env.SERVER_HTTP || 8080;
var socket;

const Led = require('./lib/led.js');
const RGBLed = require('./lib/rgbled.js');
const Servo = require('./lib/servo.js');
const Button = require('./lib/button.js');
const Sensor = require('./lib/sensor.js');

let items = {};
items['LED 1'] = new Led(17, 'red', {min: 1, max: 255} );
items['LED 2'] = new Led(27, 'yellow', {min: 1, max: 255} );
items['LED 3'] = new Led(22, 'green', {min: 1, max: 51} );
items['LED 4'] = new Led(10, 'blue', {min: 1, max: 255} );
items['RGB LED 1'] = new RGBLed({ red: 23, green: 24, blue: 25});
items['RGB LED 2'] = new RGBLed({ red: 21, green: 20, blue: 16});
items['RGB LED 3'] = new RGBLed({ red: 26, green: 19, blue: 13});
items['Servo 1'] = new Servo(18);
items['Button 1'] = new Button(6, buttonCallback('Button 1'));
items['Sensor 1'] = new Sensor(5, sensorCallback('Sensor 1'));

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

http.listen(serverPort);
console.log('server listening on http://' + ipv4adresses()[0] + ':' + serverPort);

function handler (request, response) { //what to do on requests to port 8080
  var uri = url.parse(request.url).pathname,
      filename = path.join(process.cwd(), 'public', uri.replace(/\/$/, '/index.html'));

  var contentTypesByExtension = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'text/javascript'
  };

  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.write('404 Not Found\n');
      response.end();
      return;
    }

    fs.readFile(filename, 'binary', function(err, file) {
      if(err) {        
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.write(err + '\n');
        response.end();
        return;
      }

      var headers = {};
      var contentType = contentTypesByExtension[path.extname(filename)];
      if (contentType) {
        headers['Content-Type'] = contentType;
      }
      response.writeHead(200, headers);
      response.write(file, 'binary');
      response.end();
    });
  });
}

/*
pushButton.on('interrupt', function (value) {
  if (value === 0) {
    items['LED 2'].off();
  } else if (value === 1) {
    items['LED 2'].on();
  } else {
    console.log('unknown value: ' + value);
  }
});
*/
io.sockets.on('connection', function (sock) {
  socket = sock;
  socket.emit('data', getItems());
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
    } else if (data.type === 'SERVO') {
      socket.on(item, function(data) {
        items[item].servoWrite(parseInt(data.value));
        socket.emit(item, items[item].rangeValue);
      });
    }
  });
  socket.on('allOff', () => {
    allOff();
  });
  socket.on('allOn', () => {
    allOn();
  });
  socket.on('smooth', (timeout) => {
    smooth(Object.keys(items), timeout);
  });
  socket.on('RGBsmooth', (timeout) => {
    smooth(['RGB LED 1', 'RGB LED 2', 'RGB LED 3'], timeout);
  });
  socket.on('LEDsmooth', (timeout) => {
    smooth(['LED 1', 'LED 2', 'LED 3', 'LED 4'], timeout);
  });
  socket.on('getData', () => {
    socket.emit('data', getItems());
  });
});

process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);

function exitHandler() {
  allOff();
  process.exit();
}

function allOff() {
  Object.keys(items).forEach( (item) => {
    var data = items[item].getData();
    if (data.type === 'LED') {
      items[item].off();
    } else if (data.type === 'RGBLED') {
      items[item].off();
    }
  });
  if (socket) {
    socket.emit('data', getItems());
  }
}

function allOn() {
  Object.keys(items).forEach( (item) => {
    var data = items[item].getData();
    if (data.type === 'LED') {
      items[item].on();
    } else if (data.type === 'RGBLED') {
      items[item].on();
    }
  });
  socket.emit('data', getItems());
}

function smooth(keys, timeout) {
  var count = Math.floor(Math.random() * 3);
  keys.forEach( (item) => {
    var data = items[item].getData();
    if (data.type === 'LED') {
      items[item].smooth(timeout + Math.random() * 1000);
    } else if (data.type === 'RGBLED') {
      items[item].smooth({
        red: (timeout + Math.random() * 1000) * (count % 3),
        green: (timeout + Math.random() * 1000) * ((count+1) % 3),
        blue: (timeout + Math.random() * 100) * ((count+2) % 3),
      });
    }
    count++;
  });
  socket.emit('data', getItems());
}

function buttonCallback(name) {
  return function(value) {
    if (socket) {
      socket.emit(name, value);
    } else {
      console.log(name + ': ' + value);
    }
  };
}

function sensorCallback(name) {
  return function() {
    if (socket) {
      socket.emit(name, true);
    } else {
      console.log(name + ' touched');
    }
  };
}

function getItems() {
  let result = {};
  Object.keys(items).forEach( (item) => {
    result[item] = items[item].getData();
  });
  return result;
}

function ipv4adresses() {
	var addresses = [];
	var interfaces = os.networkInterfaces();
	for (var k in interfaces) {
		for (var k2 in interfaces[k]) {
			var address = interfaces[k][k2];
			if (address.family === 'IPv4' && !address.internal) {
				addresses.push(address.address);
			}
		}
	}
	return addresses;
}


