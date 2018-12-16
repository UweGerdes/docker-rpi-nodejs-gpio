/*
 * Start a HTTP server for raspberry pi gpio control
 *
 * node server.js
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */

'use strict';

const chalk = require('chalk'),
  fs = require('fs'),
  http = require('http').createServer(handler),
  ipc = require('node-ipc'),
  io = require('socket.io')(http),
  path = require('path'),
  url = require('url'),
  config = require('./lib/config').config,
  ipv4addresses = require('./lib/ipv4addresses');

const serverPort = config.server.httpPort || process.env.SERVER_HTTP || 8080;
let socket;

let items = {};
let items2 = {};

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
          for (const [name, data] of Object.entries(list)) {
            ipc.of.gpio.emit(
              'app.create',
              {
                group: group,
                name: name,
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
      'app.created',
      (data) => { // jscs:ignore jsDoc
        if (!items2[data.group]) {
          items2[data.group] = { };
        }
        items2[data.group][data.name] = data.data;
        if (socket) {
          socket.emit(data.id + '.created', data);
        }
      }
    );
    ipc.of.gpio.on(
      'app.message',
      (message) => { // jscs:ignore jsDoc
        ipc.log('server:', message);
      }
    );
    ipc.of.gpio.on(
      'app.item.data',
      (data) => { // jscs:ignore jsDoc
        items2[data.group][data.item] = data.data;
        if (socket) {
          socket.emit('item.data.' + data.group + '.' + data.item, data.data);
        }
      }
    );
    ipc.of.gpio.on(
      'gpio.item-status',
      (data) => { // jscs:ignore jsDoc
        items2[data.group][data.item] = data.data;
        if (socket) {
          socket.emit('item.data.' + data.group + '.' + data.item, data.data);
        }
      }
    );
  }
);

http.listen(serverPort);
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
    socket.emit('items', items2);
  });
  socket.on('setValue', (data) => { // jscs:ignore jsDoc
    ipc.of.gpio.emit('app.setValue', data);
  });
});

process.once('SIGUSR2', exitHandler);
process.once('SIGTERM', exitHandler);

function exitHandler() { // jscs:ignore jsDoc
  console.log('server exiting');
  process.exit();
}

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

function getItems() { // jscs:ignore jsDoc
  let result = {};
  Object.keys(items).forEach((item) => { // jscs:ignore jsDoc
    result[item] = items[item].getData();
  });
  return result;
}
