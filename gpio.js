/**
 * ## GPIO server
 *
 * @module gpio
 */
'use strict';

const ipc = require('node-ipc');

const items = {};
items.Led = require('./lib/led.js');
items.RGBLed = require('./lib/rgbled.js');
items.Servo = require('./lib/servo.js');
items.Button = require('./lib/button.js');
items.Sensor = require('./lib/sensor.js');

ipc.config.id = 'gpio';
ipc.config.retry = 1500;
ipc.config.silent = true;

ipc.serveNet(
  () => { // jscs:ignore jsDoc
    ipc.server.on(
      'app.create',
      (data, socket) => { // jscs:ignore jsDoc
        ipc.log('gpio received:', data);
        ipc.server.emit(
          socket,
          'app.message',
          {
            id: ipc.config.id,
            created: data
          }
        );
      }
    );
  }
);

ipc.server.start();
