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
const messages = {};
let updateInterval = null;

ipc.config.id = 'gpio';
ipc.config.retry = 1500;
ipc.config.silent = true;

/**
 * Report the gpio status
 *
 * @param {ipc} socket - connection
 * @param {string} group - group name
 * @param {string} item - item name
 */
function sendStatus(socket, group, item) {
  /**
   * Report the gpio status
   *
   * @event gpio.item-status
   * @property {string} group - group name
   * @property {string} item - item name
   * @property {object} data - status information
   */
  ipc.server.emit(
    socket,
    'gpio.item-status',
    {
      group: group,
      item: item,
      data: objects[group][item].getData()
    }
  );
}
/**
 * Switch off LED, RGBLED or Servo middle
 *
 * @alias module:gpio.item-off
 * @fires gpio.item-data
 * @param {object} data - item to switch off
 * @param {ipc} socket - connection
 * @listens gpio.item-off
 */
messages['gpio.item-off'] = (data, socket) => {
  if (objects[data.group][data.item].off) {
    objects[data.group][data.item].off();
    items[data.group][data.item] = objects[data.group][data.item].getData();
    sendStatus(socket, data.group, data.item);
    checkInterval();
  }
};
/**
 * Switch on LED, RGBLED
 *
 * @alias module:gpio.item-on
 * @fires gpio.item-data
 * @param {object} data - item to switch on
 * @param {ipc} socket - connection
 * @listens gpio.item-on
 */
messages['gpio.item-on'] = (data, socket) => {
  if (objects[data.group][data.item].on) {
    objects[data.group][data.item].on();
    items[data.group][data.item] = objects[data.group][data.item].getData();
    sendStatus(socket, data.group, data.item);
    checkInterval();
  }
};
/**
 * Smooth color change LED, RGBLED
 *
 * @alias module:gpio.item-smooth
 * @fires gpio.item-data
 * @param {object} data - item to set smooth mode
 * @param {ipc} socket - connection
 * @listens gpio.item-on
 */
messages['gpio.item-smooth'] = (data, socket) => {
  if (objects[data.group][data.item].smooth) {
    objects[data.group][data.item].smooth(data.timeout);
    items[data.group][data.item] = objects[data.group][data.item].getData();
    if (updateInterval === null) {
      /** send status while smooth */
      const intervalFunc = () => {
        for (const [group, item] of Object.entries(items)) {
          for (const name of Object.keys(item)) {
            if (items[group][name].smoothTimeout) {
              sendStatus(socket, group, name);
            }
          }
        }
      };
      updateInterval = setInterval(intervalFunc, 200);
    }
  }
};
/**
 * Gpio item off event
 *
 * @alias module:gpio
 * @event gpio.item-off
 * @property {object} data - item information
 * @property {object} socket - connection for reply
 */

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
        const inputCallback = (status) => { // jscs:ignore jsDoc
          console.log('sendStatus', data, status);
          sendStatus(socket, data.group, data.name);
        };
        objects[data.group][data.name] = new devices[data.data.type](data.data, inputCallback);
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
    for (const [event, func] of Object.entries(messages)) {
      ipc.server.on(event, func);
    }
  }
);

ipc.server.start();

/** check for active timeouts and clear interval if possible */
function checkInterval() {
  let timeoutActive = false;
  for (const list of Object.values(items)) {
    for (const data of Object.values(list)) {
      if (data.smoothTimeout) {
        timeoutActive = true;
      }
    }
  }
  if (!timeoutActive && updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}
