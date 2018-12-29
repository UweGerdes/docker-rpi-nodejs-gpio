/**
 * receive events from server
 *
 * @module gpio/socker-events
 */

'use strict';

/* globals socket */
// var socket = io(); //loaded in html

window.addEventListener('load', documentLoaded);

let items = {};

function documentLoaded() {
  const emitterElements = document.querySelectorAll('[data-emit]');
  emitterElements.forEach((element) => {
    addEmitter(element);
  });
  const valueElements = document.querySelectorAll('[value]');
  valueElements.forEach((element) => {
    addValueEmitter(element);
  });
  const statusElements = document.querySelectorAll('.gpio-item-status[data-type=LED], .gpio-item-status[data-type=RGBLED]');
  statusElements.forEach((element) => {
    addStatusEmitter(element);
  });
  const uiElements = document.querySelectorAll('[data-group][data-name]');
  uiElements.forEach((element) => {
    if (!items[element.dataset.group]) {
      items[element.dataset.group] = {};
    }
    if (!items[element.dataset.group][element.dataset.name]) {
      items[element.dataset.group][element.dataset.name] = [];
    }
    items[element.dataset.group][element.dataset.name].push(element);
  });
  socket.emit('getItems', true);
}

socket.on('connect', () => {
  console.log('connected');
});

socket.on('connect_error', (error) => {
  console.log('connect_error', error);
});

socket.on('item.data', (data) => {
  // console.log('item.data', data);
  items[data.group][data.item].forEach((element) => {
    if (data.data.smoothTimeout) {
      element.dataset.status = 'smooth';
    } else {
      element.dataset.status = '';
    }
    if (element.classList.contains('gpio-item-status')) {
      if (data.data.type === 'LED') {
        element.style.backgroundColor = rgb2hex({ [data.data.color]: data.data.pwmValue });
      } else if (data.data.type === 'RGBLED') {
        element.style.backgroundColor = rgb2hex(data.data.pwmValue);
      } else if (data.data.type === 'Sensor') {
        element.classList.toggle('touched');
      } else {
        console.log('other status item.data', data);
      }
    }
    if (element.type === 'range') {
      if (data.data.type === 'LED') {
        element.value = data.data.pwmValue;
      } else if (data.data.type === 'RGBLED') {
        element.value = data.data.pwmValue[element.dataset.color];
      } else if (data.data.type === 'Servo') {
        element.value = data.data.pwmValue;
      } else {
        console.log('other item.data', data);
      }
    }
  });
});

function addEmitter(element) {
  element.addEventListener('click', () => {
    socket.emit(
      element.dataset.emit,
      JSON.parse(
        element.dataset.data
          .replace(/'/g, '"')
          .replace(/([A-Za-z0-9_-]+):/g, '"$1":')
      )
    );
  });
}

function addValueEmitter(element) {
  element.addEventListener('change', (event) => {
    const value = event.currentTarget.value;
    if (value.indexOf('#') === 0) {
      socket.emit('setValue',
        {
          group: element.dataset.group,
          item: element.dataset.name,
          pwmValue: hex2rgb(value)
        });
    } else {
      socket.emit('setValue',
        {
          group: element.dataset.group,
          item: element.dataset.name,
          color: element.dataset.color,
          pwmValue: parseInt(value, 10)
        });
    }
  });
}

function addStatusEmitter(element) {
  element.addEventListener('click', (event) => {
    if (event.currentTarget.getAttribute('data-status') === 'smooth') {
      socket.emit('off',
        {
          group: element.dataset.group,
          item: element.dataset.name
        });
    } else {
      socket.emit('smooth', { group: element.dataset.group, item: element.dataset.name, timeout: 2000 });
    }
  });
}

function hex2rgb(hex) {
  // Expand shorthand form (e.g. '03F') to full form (e.g. '0033FF')
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    red: parseInt(result[1], 16),
    green: Math.round(parseInt(result[2], 16) / 5),
    blue: Math.round(parseInt(result[3], 16) / 5)
  } : null;
}

function rgb2hex(color) {
  let hex = '';
  if (Object.keys(color)[0] === 'yellow') {
    hex += componentToHex(color.yellow);
    hex += hex;
    hex += '00';
  } else {
    ['red', 'green', 'blue'].forEach((rgb) => {
      let col = color[rgb];
      if (typeof col === 'string') {
        col = parseInt(col, 10);
      }
      col = rgb !== 'red' ? Math.min(col * 5, 255) : col;
      hex += componentToHex(col);
    });
  }
  return '#' + hex;
}

function componentToHex(c) {
  let hex = '00';
  if (c) {
    hex = c.toString(16);
  }
  return hex.length === 1 ? '0' + hex : hex;
}
