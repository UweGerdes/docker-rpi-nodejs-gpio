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
  const statusElements = document.querySelectorAll('[data-type=LED], [data-type=RGBLED]');
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
    if (element.type === 'range') {
      if (data.data.type === 'LED') {
        console.log('LED item.data', data);
        element.value = data.data.pwmValue;
      } else if (data.data.type === 'RGBLED') {
        console.log('RGBLED item.data', data);
        element.value = data.data.pwmValue;
      } else if (data.data.type === 'Servo') {
        console.log('Servo item.data', data);
        element.value = data.data.pwmValue;
      } else  {
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
