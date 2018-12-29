/**
 * receive events from server
 *
 * @module gpio/socker-events
 */

'use strict';

/* globals socket */
// var socket = io(); //loaded in html

window.addEventListener('load', documentLoaded);

function documentLoaded() {
  const emitterElements = document.querySelectorAll('[data-emit]');
  emitterElements.forEach((element) => {
    addEmitter(element);
  });
  socket.emit('getItems', true);
}

socket.on('connect', () => {
  console.log('connected');
});

socket.on('connect_error', (error) => {
  console.log('connect_error', error);
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
