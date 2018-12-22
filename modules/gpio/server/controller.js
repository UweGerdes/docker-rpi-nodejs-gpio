/**
 * ## Controller for gpio
 *
 * @module gpio/controller
 */

'use strict';

const chalk = require('chalk'),
  http = require('http').createServer(),
  ipc = require('node-ipc'),
  path = require('path'),
  io = require('socket.io')(http),
  config = require('../../../lib/config').config,
  ipv4addresses = require('../../../lib/ipv4addresses'),
  model = require('./model.js');

const viewBase = path.join(path.dirname(__dirname), 'views');

let socket;

let items = {};

ipc.config.id = 'client';
ipc.config.retry = 1000;
ipc.config.silent = true;

/**
 * connect to gpio backend server
 */
ipc.connectToNet('gpio', () => {
  /**
   * on connect create items
   */
  ipc.of.gpio.on('connect', () => {
    console.log('connected to gpio', config);
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
   * on disconnect show message
   */
  ipc.of.gpio.on('disconnect', () => {
    console.log('disconnected from gpio');
  });
  /**
   * set up internal data for items reported by gpio
   *
   * @param {object} data - item data
   */
  ipc.of.gpio.on('gpio.created', (data) => {
    console.log('gpio.created', data);
    if (!items[data.group]) {
      items[data.group] = { };
    }
    items[data.group][data.name] = data.data;
    if (socket) {
      socket.emit(data.id + '.created', data);
    }
  });
  /**
   * receive item status from gpio
   *
   * @param {object} data - item data
   */
  ipc.of.gpio.on('gpio.item-status', (data) => {
    console.log('gpio.item-status', data);
    items[data.group][data.item] = data.data;
    if (socket) {
      socket.emit('item.data.' + data.group + '.' + data.item, data.data);
    }
  });
});

http.listen(8082);
console.log('server listening on ' +
  chalk.greenBright('http://' + ipv4addresses.get()[0] + ':' + 8082));

io.sockets.on('connection', function (newSocket) { // jscs:ignore jsDoc
  socket = newSocket;
  socket.on('allOff', () => { // jscs:ignore jsDoc
    allOff();
  });
  socket.on('allOn', () => { // jscs:ignore jsDoc
    allOn();
  });
  socket.on('allSmooth', (timeout) => { // jscs:ignore jsDoc
    smooth(undefined, undefined, timeout);
  });
  socket.on('off', (data) => { // jscs:ignore jsDoc
    off(data.group, data.item);
  });
  socket.on('smooth', (data) => { // jscs:ignore jsDoc
    smooth(data.group, data.item, data.timeout);
  });
  socket.on('getItems', () => { // jscs:ignore jsDoc
    socket.emit('items', items);
  });
  socket.on('setValue', (data) => { // jscs:ignore jsDoc
    ipc.of.gpio.emit('gpio.setValue', data);
  });
});

function allOff() { // jscs:ignore jsDoc
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

function allOn() { // jscs:ignore jsDoc
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

function off(group, item) { // jscs:ignore jsDoc
  ipc.of.gpio.emit(
    'gpio.item-off',
    {
      group: group,
      item: item
    }
  );
}

function smooth(group, item, timeout) { // jscs:ignore jsDoc
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
  // view helper functions
};

/**
 * ### index page
 *
 * render the index page
 *
 * @param {object} req - request
 * @param {object} res - result
 */
const index = (req, res) => {
  let data = Object.assign({
    title: 'gpio'
  },
  req.params,
  getHostData(req),
  viewRenderParams,
  model.getData());
  res.render(path.join(viewBase, 'index.pug'), data);
};

module.exports = {
  index: index
};

/**
 * Get the host data for livereload
 *
 * @private
 * @param {String} req - request
 */
function getHostData(req) {
  let livereloadPort = config.server.livereloadPort || process.env.LIVERELOAD_PORT;
  const host = req.get('Host');
  if (host.indexOf(':') > 0) {
    livereloadPort = parseInt(host.split(':')[1], 10) + 1;
  }
  const module = require(path.join('..', 'config.json'));
  return {
    environment: process.env.NODE_ENV,
    hostname: req.hostname,
    livereloadPort: livereloadPort,
    module: module
  };
}
