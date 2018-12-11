
'use strict';

/* jshint browser: true */
/* globals socket */
//var socket = io(); //loaded in html

let changedPicker = false;

window.addEventListener('load', documentLoaded);

function documentLoaded() { // jscs:ignore jsDoc
  const allOff = document.getElementById('allOff');
  allOff.addEventListener('click', () => { // jscs:ignore jsDoc
    socket.emit('allOff', true);
  });
  const allOn = document.getElementById('allOn');
  allOn.addEventListener('click', () => { // jscs:ignore jsDoc
    socket.emit('allOn', true);
  });
  const smooth = document.getElementById('smooth');
  smooth.addEventListener('click', () => { // jscs:ignore jsDoc
    socket.emit('smooth', 2000);
  });
  document.getElementById('RGBsmooth').addEventListener('click', () => { // jscs:ignore jsDoc
    socket.emit('RGBsmooth', 2000);
  });
  document.getElementById('LEDsmooth').addEventListener('click', () => { // jscs:ignore jsDoc
    socket.emit('LEDsmooth', 2000);
  });
  socket.emit('getItems', true);
}

socket.on('items', (items) => { // jscs:ignore jsDoc
  const container = document.getElementById('elementContainer');
  if (container) {
    createElements(container, items);
  }
});

socket.on('item.data', (data) => { // jscs:ignore jsDoc
  console.log('TODO received item.data', data);
  //var element = document.querySelector(
});

function createElements(container, data) { // jscs:ignore jsDoc
  while (container.childNodes.length > 0) {
    //container.childNodes[0].removeEventListener
    container.removeChild(container.childNodes[0]);
  }
  for (const [group, items] of Object.entries(data)) {
    const newDiv = document.createElement('div');
    newDiv.setAttribute('id', group + '_container');
    newDiv.setAttribute('class', 'element_container');
    for (const [item, data] of Object.entries(items)) { // jscs:ignore jsDoc
      newDiv.appendChild(createElement(group, item, data));
    }
    container.appendChild(newDiv);
  }
}

function createElement(group, item, data) { // jscs:ignore jsDoc
  const id = item.replace(/[^A-Za-z0-9-]/g, '_');
  const newDiv = document.createElement('div');
  newDiv.setAttribute('id', id + '_container');
  newDiv.setAttribute('class', data.type + '_container');
  const newLabel = document.createElement('label');
  newLabel.setAttribute('class', data.type + '_label' + (data.color ? ' ' + data.color : ''));
  newLabel.setAttribute('for', id);
  const newLabelText = document.createTextNode(item);
  newLabel.appendChild(newLabelText);
  if (data.color) {
    newDiv.appendChild(makePreview(group, item, id, data.type, data.color, data.pwmValue));
  }
  newDiv.appendChild(newLabel);
  console.log(data.type);
  newDiv.appendChild(elementTypes[data.type](group, item, id, data));
  return newDiv;
}

const elementTypes = {
  LED: makeLED,
  RGBLED: makeRGBLED,
  Servo: makeServo,
  Button: makeButton,
  Sensor: makeSensor,
};

function makeLED(group, item, id, data) { // jscs:ignore jsDoc
  const newControls = document.createElement('div');
  newControls.setAttribute('class', data.type + '_controls');
  newControls.setAttribute('data-group', group);
  newControls.setAttribute('data-item', item);
  const element = makeRange(group, item, id, data.range, data.pwmValue, data.color);
  newControls.appendChild(element);
  return newControls;
}

function makeRGBLED(group, item, id, data) { // jscs:ignore jsDoc
  const newControls = document.createElement('div');
  newControls.setAttribute('class', data.type + '_controls');
  newControls.setAttribute('data-group', group);
  newControls.setAttribute('data-item', item);
  data.color.forEach((color) => { // jscs:ignore jsDoc
    const element = makeRange(group, item, id, data.range[color], data.pwmValue[color], color);
    newControls.appendChild(element);
  });
  const element = document.createElement('input');
  element.setAttribute('id', id + '_picker');
  element.setAttribute('type', 'color');
  element.setAttribute('value', rgbToHex(data.pwmValue));
  element.addEventListener('change', (event) => { // jscs:ignore jsDoc
    changedPicker = true;
    const color = hexToRgb(event.currentTarget.value);
    socket.emit('setValue',
      {
        group: group,
        item: item,
        pwmValue: color
      }
    );
  });
  socket.on('item.data.' + group + '.' + item, (data) => { // jscs:ignore jsDoc
    if (data.pwmValue) {
      element.value = rgbToHex(data.pwmValue);
    } else {
      console.log('ERROR item.data.' + group + '.' + item, data);
    }
  });
  newControls.appendChild(element);
  return newControls;
}

function makePreview(group, item, id, type, color, pwmValue = 0) { // jscs:ignore jsDoc
  const element = document.createElement('div');
  element.setAttribute('id', id + '_preview');
  element.setAttribute('class', type + '_preview');
  element.setAttribute('data-group', group);
  element.setAttribute('data-item', item);
  let pwm = {};
  if (typeof pwmValue === 'number') {
    pwm[color] = pwmValue;
  } else {
    pwm = {
      red: pwmValue.red,
      green: pwmValue.green * 5,
      blue: pwmValue.blue * 5
    };
  }
  element.setAttribute('data-pwmValue', pwm, rgbToHex(pwm));
  element.style.backgroundColor = rgbToHex(pwm);
  socket.on('item.data.' + group + '.' + item, (data) => { // jscs:ignore jsDoc
    if (data.color && typeof data.color === 'string') {
      const color = { };
      color[data.color] = data.pwmValue;
      element.style.backgroundColor = rgbToHex(color);
    } else if (data.pwmValue) {
      element.style.backgroundColor = rgbToHex(data.pwmValue);
    } else {
      console.log('ERROR item.data.' + group + '.' + item, data);
    }
  });
  return element;
}

function makeRange(group, item, id, range, pwmValue, color) { // jscs:ignore jsDoc
  const element = document.createElement('input');
  element.setAttribute('id', id + '_' + color);
  element.setAttribute('type', 'range');
  element.setAttribute('min', range.min);
  element.setAttribute('max', range.max);
  element.setAttribute('value', pwmValue < 0 ? '0' : pwmValue);
  element.setAttribute('class', 'slider ' + color);
  element.setAttribute('data-group', group);
  element.setAttribute('data-item', item);
  try {
    addRule('#' + id + '_' + color + '::-webkit-slider-thumb', { 'background': color });
  } catch (e) { /* not webkit */ }
  try {
    addRule('#' + id + '_' + color + '::-moz-range-thumb', { 'background': color });
  } catch (e) { /* not mozilla */ }
  element.addEventListener('change', (event) => { // jscs:ignore jsDoc
    socket.emit('setValue',
      {
        group: group,
        item: item,
        color: color,
        pwmValue: parseInt(event.currentTarget.value)
      }
    );
  });
  socket.on('item.data.' + group + '.' + item, (data) => { // jscs:ignore jsDoc
    if (data.color && typeof data.color === 'string') {
      element.value = data.pwmValue <= 0 ? '1' : data.pwmValue;
    } else if (data.pwmValue) {
      if (data.pwmValue[color] >= 0) {
        element.value = data.pwmValue[color] <= 0 ? '1' : data.pwmValue[color];
      }
    } else {
      console.log('ERROR item.data.' + group + '.' + item, data);
    }
  });
  return element;
}

function makeServo(group, item, id, data) { // jscs:ignore jsDoc
  const div = document.createElement('div');
  div.setAttribute('class', data.type + '_controls');
  div.setAttribute('data-group', group);
  div.setAttribute('data-item', item);
  div.appendChild(makeServoButtons(group, item, id, data,
      {
        'Links': data.range.min,
        'Halblinks': data.range.min + (data.range.max - data.range.min) / 4,
        'Mitte': data.midValue,
        'Halbrechts': data.range.min + (data.range.max - data.range.min) * 3 / 4,
        'Rechts': data.range.max,
      }));
  div.appendChild(makeServoRange(group, item, id, data.range, data.rangeValue));
  return div;
}

function makeServoRange(group, item, id, range, rangeValue, color) { // jscs:ignore jsDoc
  const element = document.createElement('input');
  element.setAttribute('id', id + '_' + color);
  element.setAttribute('type', 'range');
  element.setAttribute('min', range.min);
  element.setAttribute('max', range.max);
  element.setAttribute('value', rangeValue < 0 ? '0' : rangeValue);
  element.setAttribute('class', 'slider range');
  element.setAttribute('data-group', group);
  element.setAttribute('data-item', item);
  element.addEventListener('change', (event) => { // jscs:ignore jsDoc
    socket.emit('setValue',
      {
        group: group,
        item: item,
        pwmValue: parseInt(event.currentTarget.value)
      }
    );
  });
  socket.on(item, (value) => { // jscs:ignore jsDoc
    element.value = value;
  });
  socket.on('item.data.' + group + '.' + item, (data) => { // jscs:ignore jsDoc
    if (data.pwmValue) {
      element.value = data.pwmValue;
    } else {
      console.log('ERROR item.data.' + group + '.' + item, data);
    }
  });
  return element;
}

function makeServoButtons(group, item, id, data, values) { // jscs:ignore jsDoc
  const container = document.createElement('div');
  container.setAttribute('class', 'controlButtons');
  container.setAttribute('data-group', group);
  container.setAttribute('data-item', item);
  const buttonContainer = document.createElement('div');
  buttonContainer.setAttribute('class', 'buttonContainer');
  Object.keys(values).forEach((key) => { // jscs:ignore jsDoc
    const button = document.createElement('button');
    button.setAttribute('id', id + '_' + key.replace(/ /g, '_'));
    button.setAttribute('name', id + '_' + key.replace(/ /g, '_'));
    button.setAttribute('value', values[key]);
    button.setAttribute('class', 'button');
    const buttonText = document.createTextNode(key);
    button.appendChild(buttonText);
    button.addEventListener('click', (event) => { // jscs:ignore jsDoc
      socket.emit('setValue',
        {
          group: group,
          item: item,
          pwmValue: parseInt(event.currentTarget.value)
        }
      );
    });
    buttonContainer.appendChild(button);
  });
  container.appendChild(buttonContainer);
  return container;
}

function makeButton(group, item, id, data) { // jscs:ignore jsDoc
  const div = document.createElement('div');
  div.setAttribute('class', data.type + '_status');
  div.setAttribute('data-group', group);
  div.setAttribute('data-item', item);
  const element = document.createElement('input');
  element.setAttribute('id', id + '_checkbox');
  element.setAttribute('type', 'checkbox');
  div.appendChild(element);
  socket.on(item, (value) => { // jscs:ignore jsDoc
    console.log('button value: ' + value);
    element.checked = value === 1;
  });
  return div;
}

function makeSensor(group, item, id, data) { // jscs:ignore jsDoc
  const div = document.createElement('div');
  div.setAttribute('class', data.type + '_status');
  div.setAttribute('data-group', group);
  div.setAttribute('data-item', item);
  const element = document.createElement('input');
  element.setAttribute('id', id + '_checkbox');
  element.setAttribute('type', 'checkbox');
  div.appendChild(element);
  socket.on('item.data.' + group + '.' + item, (data) => { // jscs:ignore jsDoc
    if (data.touched) {
      element.checked = !element.checked;
    }
  });
  return div;
}

const addRule = ((style) => { // jscs:ignore jsDoc
  const sheet = document.head.appendChild(style).sheet;
  return function (selector, css) { // jscs:ignore jsDoc
    const propText = typeof css === 'string' ? css : Object.keys(css).map(
      function (p) { // jscs:ignore jsDoc
        return p + ':' + (p === 'content' ? '\'' + css[p] + '\'' : css[p]);
      }).join(';');
    sheet.insertRule(selector + '{' + propText + '}', sheet.cssRules.length);
  };
})(document.createElement('style'));

function hexToRgb(hex) { // jscs:ignore jsDoc
  // Expand shorthand form (e.g. '03F') to full form (e.g. '0033FF')
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => { // jscs:ignore jsDoc
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    red: parseInt(result[1], 16),
    green: Math.round(parseInt(result[2], 16) / 5),
    blue: Math.round(parseInt(result[3], 16) / 5)
  } : null;
}

function componentToHex(c) { // jscs:ignore jsDoc
  let hex = '00';
  if (c) {
    hex = c.toString(16);
  }
  return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(color) { // jscs:ignore jsDoc
  let hex = '';
  if (Object.keys(color)[0] == 'yellow') {
    hex += componentToHex(color.yellow);
    hex += hex;
    hex += '00';
  } else {
    ['red', 'green', 'blue'].forEach((rgb) => { // jscs:ignore jsDoc
      let col = color[rgb];
      if (typeof col == 'string') {
        col = parseInt(col);
      }
      col = rgb != 'red' ? Math.min(col * 5, 255) : col;
      hex += componentToHex(col);
    });
  }
  return '#' + hex;
}
