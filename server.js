/*
 * Start a HTTP server for gpio led control
 *
 * node server.js
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */

'use strict';

const chalk = require('chalk'),
  fs = require('fs'),
  http = require('http').createServer(handler),
  io = require('socket.io')(http),
  path = require('path'),
  url = require('url'),
  config = require('./lib/config').config,
  ipv4addresses = require('./lib/ipv4addresses');

const serverPort = config.server.httpPort || process.env.SERVER_HTTP || 8080;
let socket;

let items = {};
/*
const Led = require('./lib/led.js');
const RGBLed = require('./lib/rgbled.js');
const Servo = require('./lib/servo.js');
const Button = require('./lib/button.js');
const Sensor = require('./lib/sensor.js');
items['LED 1'] = new Led(17, 'red', {min: 1, max: 255} );
items['LED 2'] = new Led(27, 'yellow', {min: 1, max: 255} );
items['LED 3'] = new Led(22, 'green', {min: 1, max: 51} );
items['LED 4'] = new Led(10, 'blue', {min: 1, max: 255} );
items['RGB LED 1'] = new RGBLed({ red: 23, green: 24, blue: 25});
items['RGB LED 2'] = new RGBLed({ red: 21, green: 20, blue: 16});
items['RGB LED 3'] = new RGBLed({ red: 26, green: 19, blue: 13});
items['Servo 1'] = new Servo(18);
items['Button 1'] = new Button(7, buttonCallback('Button 1'));
items['Sensor 1'] = new Sensor(8, sensorCallback('Sensor 1'));
*/

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

//http.listen(serverPort);
console.log('server listening on ' +
  chalk.greenBright('http://' + ipv4addresses.get()[0] + ':' + serverPort));

function handler(request, response) { // jscs:ignore jsDoc
  const uri = url.parse(request.url).pathname,
      filename = path.join(process.cwd(), 'public', uri.replace(/\/$/, '/index.html'));

  const contentTypesByExtension = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'text/javascript'
  };

  fs.exists(filename, (exists) => { // jscs:ignore jsDoc
    if (!exists) {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.write('404 Not Found\n');
      response.end();
      return;
    }

    fs.readFile(filename, 'binary', (err, file) => { // jscs:ignore jsDoc
      if (err) {
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        response.write(err + '\n');
        response.end();
        return;
      }

      const headers = {};
      const contentType = contentTypesByExtension[path.extname(filename)];
      if (contentType) {
        headers['Content-Type'] = contentType;
      }
      response.writeHead(200, headers);
      response.write(file, 'binary');
      response.end();
    });
  });
}

io.sockets.on('connection', function (sock) { // jscs:ignore jsDoc
  socket = sock;
  socket.emit('data', getItems());
  Object.keys(items).forEach((item) => { // jscs:ignore jsDoc
    const data = items[item].getData();
    if (data.type === 'LED') {
      socket.on(item, (data) => { // jscs:ignore jsDoc
        if (typeof data.pwmValue === 'string') {
          console.log('received string value: %o' + data);
        }
        items[item].pwmWrite(parseInt(data.pwmValue));
        const pwmValue = {};
        pwmValue[items[item].color] = items[item].pwmValue;
        socket.emit(item, pwmValue);
      });
    } else if (data.type === 'RGBLED') {
      socket.on(item, (data) => { // jscs:ignore jsDoc
        items[item].pwmWrite(data);
        socket.emit(item, items[item].pwmValue);
      });
    } else if (data.type === 'SERVO') {
      socket.on(item, (data) => { // jscs:ignore jsDoc
        items[item].servoWrite(parseInt(data.value));
        socket.emit(item, items[item].rangeValue);
      });
    }
  });
  socket.on('allOff', () => { // jscs:ignore jsDoc
    allOff();
  });
  socket.on('allOn', () => { // jscs:ignore jsDoc
    allOn();
  });
  socket.on('smooth', (timeout) => { // jscs:ignore jsDoc
    smooth(Object.keys(items), timeout);
  });
  socket.on('RGBsmooth', (timeout) => { // jscs:ignore jsDoc
    smooth(['RGB LED 1', 'RGB LED 2', 'RGB LED 3'], timeout);
  });
  socket.on('LEDsmooth', (timeout) => { // jscs:ignore jsDoc
    smooth(['LED 1', 'LED 2', 'LED 3', 'LED 4'], timeout);
  });
  socket.on('getData', () => { // jscs:ignore jsDoc
    socket.emit('data', getItems());
  });
});

//process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);

function exitHandler() { // jscs:ignore jsDoc
  //allOff();
  process.exit();
}

function allOff() { // jscs:ignore jsDoc
  /*
  Object.keys(items).forEach((item) => { // jscs:ignore jsDoc
    const data = items[item].getData();
    if (data.type === 'LED') {
      items[item].off();
    } else if (data.type === 'RGBLED') {
      items[item].off();
    }
  });
  */
  if (socket) {
    socket.emit('data', getItems());
  }
}

function allOn() { // jscs:ignore jsDoc
  Object.keys(items).forEach((item) => { // jscs:ignore jsDoc
    const data = items[item].getData();
    if (data.type === 'LED') {
      items[item].on();
    } else if (data.type === 'RGBLED') {
      items[item].on();
    }
  });
  socket.emit('data', getItems());
}

function smooth(keys, timeout) { // jscs:ignore jsDoc
  let count = Math.floor(Math.random() * 3);
  keys.forEach((item) => { // jscs:ignore jsDoc
    const data = items[item].getData();
    if (data.type === 'LED') {
      items[item].smooth(timeout + Math.random() * 1000);
    } else if (data.type === 'RGBLED') {
      items[item].smooth({
        red: (timeout + Math.random() * 1000) * (count % 3),
        green: (timeout + Math.random() * 1000) * ((count + 1) % 3),
        blue: (timeout + Math.random() * 100) * ((count + 2) % 3),
      });
    }
    count++;
  });
  socket.emit('data', getItems());
}

/*
function buttonCallback(name) { // jscs:ignore jsDoc
  return (value) => { // jscs:ignore jsDoc
    if (socket) {
      socket.emit(name, value);
    } else {
      console.log(name + ': ' + value);
    }
  };
}

function sensorCallback(name) { // jscs:ignore jsDoc
  return () => { // jscs:ignore jsDoc
    if (socket) {
      socket.emit(name, true);
    } else {
      console.log(name + ' touched');
    }
  };
}
*/

function getItems() { // jscs:ignore jsDoc
  let result = {};
  Object.keys(items).forEach((item) => { // jscs:ignore jsDoc
    result[item] = items[item].getData();
  });
  return result;
}

const ipc = require('node-ipc');

ipc.config.id = 'client';
ipc.config.retry = 1000;
ipc.config.silent = true;

ipc.connectToNet(
  'gpio',
  () => { // jscs:ignore jsDoc
    ipc.of.gpio.on(
      'connect',
      () => { // jscs:ignore jsDoc
        for (const [group, list] of Object.entries(config.gpio)) {
          console.log('group', group);
          items[group] = [];
          for (const [name, data] of Object.entries(list)) {
            //ipc.log('## connected to gpio ##', ipc.config.delay);
            ipc.of.gpio.emit(
              'app.create',
              {
                group: group,
                id: name,
                data: data
              }
            );
          }
        }
      }
    );
    ipc.of.gpio.on(
      'disconnect',
      () => { // jscs:ignore jsDoc
        ipc.log('disconnected from gpio');
      }
    );
    ipc.of.gpio.on(
      'app.message',
      (message) => { // jscs:ignore jsDoc
        ipc.log('got a message from gpio:', message);
      }
    );

    console.log('destroy', ipc.of.gpio.destroy);
  }
);
