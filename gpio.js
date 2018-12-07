/**
 * ## GPIO server
 *
 * @module gpio
 */
'use strict';

const ipc = require('node-ipc');

const devices = {};
devices.LED = require('./lib/led.js');
devices.RGBLED = require('./lib/rgbled.js');
devices.Servo = require('./lib/servo.js');
devices.Button = require('./lib/button.js');
devices.Sensor = require('./lib/sensor.js');

const objects = {};
const items = {};

ipc.config.id = 'gpio';
ipc.config.retry = 1500;
ipc.config.silent = true;

ipc.serveNet(
  () => { // jscs:ignore jsDoc
    ipc.server.on(
      'app.create',
      (data, socket) => { // jscs:ignore jsDoc
        if (!objects[data.group]) {
          objects[data.group] = { };
        }
        if (!items[data.group]) {
          items[data.group] = { };
        }
        objects[data.group][data.name] = new devices[data.data.type](data.data);
        items[data.group][data.name] = objects[data.group][data.name].getData();
        ipc.server.emit(
          socket,
          'app.created',
          {
            id: ipc.config.id,
            group: data.group,
            name: data.name,
            data: items[data.group][data.name]
          }
        );
      }
    );
    ipc.server.on(
      'app.setValue',
      (data, socket) => { // jscs:ignore jsDoc
        if (objects[data.group] &&
            objects[data.group][data.item] &&
            objects[data.group][data.item].setValue
        ) {
          objects[data.group][data.item].setValue(data);
          ipc.server.emit(
            socket,
            'app.item.data',
            {
              group: data.group,
              item: data.item,
              data: objects[data.group][data.item].getData()
            }
          );
        } else {
          console.log('no setValue for', data);
        }
      }
    );
    ipc.server.on(
      'app.off',
      (data, socket) => { // jscs:ignore jsDoc
        if (objects[data.group][data.name].off) {
          console.log('app.off:', data);
          objects[data.group][data.name].off();
          items[data.group][data.name] = objects[data.group][data.name].getData();
          ipc.server.emit(
            socket,
            'app.message',
            {
              id: ipc.config.id,
              off: items[data.group][data.name]
            }
          );
        }
      }
    );
  }
);

ipc.server.start();
