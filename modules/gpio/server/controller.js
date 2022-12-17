/**
 * ## Controller for gpio
 *
 * @module gpio/controller
 * @requires module:lib/config
 * @requires module:lib/log
 * @requires module:gpio/model
 */

'use strict';

const ipc = require('node-ipc'),
  path = require('path'),
  { Server } = require('socket.io'),
  config = require('../../../lib/config'),
  log = require('../../../lib/log'),
  model = require('./model.js');

const viewBase = path.join(path.dirname(__dirname), 'views');

let socket,
  io;

let items = {};

ipc.config.id = 'client';
ipc.config.retry = 1000;
ipc.config.silent = true;

config.gpio = config.modules.gpio.gpio;

/**
 * connect to gpio backend server
 */
ipc.connectToNet('gpio', () => {
  /**
   * on connect create items
   */
  ipc.of.gpio.on('connect', () => {
    log.info('controller connected to gpio');
    for (const [group, list] of Object.entries(config.gpio)) {
      for (const [name, data] of Object.entries(list)) {
        ipc.of.gpio.emit(
          'gpio.create',
          {
            group: group,
            name: name,
            data: data
          }
        );
      }
    }
  });
  /**
   * on disconnect show message and force disconnect
   */
  ipc.of.gpio.on('disconnect', () => {
    log.info('controller disconnected from gpio');
    ipc.disconnect('gpio');
  });
  /**
   * set up internal data for items reported by gpio
   *
   * @param {object} data - item data
   */
  ipc.of.gpio.on('gpio.created', (data) => {
    if (!items[data.group]) {
      items[data.group] = { };
    }
    items[data.group][data.name] = data.data;
  });
  /**
   * receive item status from gpio
   *
   * @param {object} data - item data
   */
  ipc.of.gpio.on('gpio.item-status', (data) => {
    // log.info('ipc gpio.item-status', data);
    items[data.group][data.item] = data.data;
    if (socket) {
      socket.emit('item.data', data);
    }
  });
});

function allOff() {
  for (const [group, list] of Object.entries(config.gpio)) {
    for (const item of Object.keys(list)) {
      ipc.of.gpio.emit(
        'gpio.item-off',
        {
          group: group,
          item: item
        }
      );
    }
  }
}

function allOn() {
  for (const [group, list] of Object.entries(config.gpio)) {
    for (const item of Object.keys(list)) {
      ipc.of.gpio.emit(
        'gpio.item-on',
        {
          group: group,
          item: item
        }
      );
    }
  }
}

function off(group, item) {
  ipc.of.gpio.emit(
    'gpio.item-off',
    {
      group: group,
      item: item
    }
  );
}

function smooth(group, item, timeout) {
  let items = config.gpio;
  if (group) {
    if (item) {
      items = { [group]: { [item]: config.gpio[group][item] } };
    } else {
      items = { [group]: config.gpio[group] };
    }
  }
  for (const [group, list] of Object.entries(items)) {
    for (const item of Object.keys(list)) {
      ipc.of.gpio.emit(
        'gpio.item-smooth',
        {
          group: group,
          item: item,
          timeout: timeout
        }
      );
    }
  }
}

const viewRenderParams = {
  // model data
  items: items
};

module.exports = {
  /**
   * index page
   *
   * render the index page
   *
   * @param {object} req - request
   * @param {object} res - result
   */
  index: (req, res) => {
    let data = {
      title: 'gpio',
      ...req.params,
      ...getData(req),
      ...viewRenderParams,
      ...model.getData()
    };
    res.render(path.join(viewBase, 'index.pug'), data);
  },
  /**
 * Use httpServer and httpsServer for socket
 *
 * @param {object} httpServer - express instance
 * @param {object} httpsServer - httpsServer instance
   */
  connectServer: (httpServer, httpsServer) => {
    io = new Server({ path: '/gpio/socket.io/', allowEIO3: true });
    io.attach(httpServer);
    io.attach(httpsServer);
    io.on('connection', function (newSocket) {
      socket = newSocket;
      socket.on('allOff', () => {
        allOff();
      });
      socket.on('allOn', () => {
        allOn();
      });
      socket.on('smooth', (data) => {
        smooth(data.group, data.item, data.timeout);
      });
      socket.on('off', (data) => {
        off(data.group, data.item);
      });
      socket.on('getItems', () => {
        socket.emit('items', items);
      });
      socket.on('setValue', (data) => {
        ipc.of.gpio.emit('gpio.setValue', data);
      });
    });
  }
};

/**
 * Get the basic data for the response
 *
 * @protected
 * @param {Object} req - request
 * @return {Object} config getData object + defaults
 */
function getData(req) {
  return Object.assign(
    config.getData(req),
    {
      data: false,
      post: { },
      loginLink: '/oauth2/login/'
    }
  );
}
