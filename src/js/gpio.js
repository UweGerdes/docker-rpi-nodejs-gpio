
'use strict';

/* jshint browser: true */
/* globals socket */
//var socket = io(); //loaded in html

var changedPicker = false;

window.addEventListener("load", documentLoaded);

function documentLoaded() {
  var allOff = document.getElementById('allOff');
  allOff.addEventListener("click", function() {
    socket.emit('allOff', true);
  });
  var allOn = document.getElementById('allOn');
  allOn.addEventListener("click", function() {
    socket.emit('allOn', true);
  });
  var smooth = document.getElementById('smooth');
  smooth.addEventListener("click", function() {
    socket.emit('smooth', 2000);
  });
  document.getElementById('RGBsmooth').addEventListener("click", function() {
    socket.emit('RGBsmooth', 2000);
  });
  document.getElementById('LEDsmooth').addEventListener("click", function() {
    socket.emit('LEDsmooth', 2000);
  });
  socket.emit('getData', true);
}

socket.on('data', function(data) {
  var container = document.getElementById('elementContainer');
  if (container) {
    createElements(container, data);
  }
});

function createElements(container, data) {
  if (container.childNodes.length > 0) {
    //container.childNodes[0].removeEventListener
    container.removeChild(container.childNodes[0]);
  }
  var newDiv = document.createElement('div');
  Object.keys(data).forEach( (item) => {
    newDiv.appendChild(createElement(item, data[item]));
  });
  container.appendChild(newDiv);
}

function createElement(item, data) {
  var id = item.replace(/[^A-Za-z0-9-]/g, "_");
  var newDiv = document.createElement('div');
  newDiv.setAttribute('id', id + '_container');
  newDiv.setAttribute('class', data.type + '_container');
  var newLabel = document.createElement('label');
  newLabel.setAttribute('class', data.type + '_label' + (data.color ? ' ' + data.color : ''));
  newLabel.setAttribute('for', id);
  var newLabelText = document.createTextNode(item);
  newLabel.appendChild(newLabelText);
  if (data.color) {
    newDiv.appendChild(makePreview(item, id, data.type, data.color, data.pwmValue));
  }
  newDiv.appendChild(newLabel);
  newDiv.appendChild(elementTypes[data.type](item, id, data));
  return newDiv;
}

var elementTypes = {
  LED: makeLED,
  RGBLED: makeRGBLED,
  SERVO: makeSERVO,
  BUTTON: makeBUTTON,
};

function makeLED (item, id, data) {
  var newControls = document.createElement('div');
  newControls.setAttribute('class', data.type + '_controls');
  var element = makeRange(item, id, data.range, data.pwmValue, data.color);
  newControls.appendChild(element);
  return newControls;
}

function makeRGBLED (item, id, data) {
  var newControls = document.createElement('div');
  newControls.setAttribute('class', data.type + '_controls');
  data.color.forEach(function(color) {
    var element = makeRange(item, id, data.range[color], data.pwmValue[color], color);
    newControls.appendChild(element);
  });
  var element = document.createElement('input');
  element.setAttribute('id', id + '_picker');
  element.setAttribute('type', 'color');
  element.setAttribute('value', rgbToHex(data.pwmValue));
  element.addEventListener("change", function() {
    changedPicker = true;
    var color = hexToRgb(this.value);
    Object.keys(color).forEach( (col) => {
      socket.emit(item, { color: col, pwmValue: color[col] });
    });
  });
  newControls.appendChild(element);
  socket.on(item, function(result) {
    var color = result;
    if ( ! changedPicker ) {
      setRgbColor(id, color);
    }
    changedPicker = false;
  });
  return newControls;
}

function makePreview(item, id, type, color, pwmValue) {
  var element = document.createElement('div');
  element.setAttribute('id', id + '_preview');
  element.setAttribute('class', type + '_preview');
  var pwm = {};
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
  socket.on(item, function(data) {
    element.style.backgroundColor = rgbToHex(data);
  });
  return element;
}

function makeRange(item, id, range, pwmValue, color) {
  var element = document.createElement('input');
  element.setAttribute('id', id + '_' + color);
  element.setAttribute('type', 'range');
  element.setAttribute('min', range.min);
  element.setAttribute('max', range.max);
  element.setAttribute('value', pwmValue < 0 ? '0' : pwmValue);
  element.setAttribute('class', 'slider ' + color);
  try {
    addRule('#' + id + '_' + color + '::-webkit-slider-thumb', { 'background': color } );
  } catch(e) { /* not webkit */ }
  try {
    addRule('#' + id + '_' + color + '::-moz-range-thumb', { 'background': color } );
  } catch(e) { /* not mozilla */ }
  element.addEventListener("change", function() {
    socket.emit(item, { color: color, pwmValue: parseInt(this.value) } );
  });
  return element;
}

function makeSERVO (item, id, data) {
console.log('making servo ' + item);
  var div = document.createElement('div');
  div.setAttribute('class', data.type + '_controls');
  div.appendChild(makeServoButtons(item, id, data, 
      {
        'Links': data.range.min,
        'Halblinks': data.range.min + (data.range.max - data.range.min) / 4,
        'Mitte': data.midValue,
        'Halbrechts': data.range.min + (data.range.max - data.range.min) * 3 / 4,
        'Rechts': data.range.max,
      }));
  div.appendChild(makeServoRange(item, id, data.range, data.rangeValue));
  return div;
}

function makeServoRange(item, id, range, rangeValue, color) {
  var element = document.createElement('input');
  element.setAttribute('id', id + '_' + color);
  element.setAttribute('type', 'range');
  element.setAttribute('min', range.min);
  element.setAttribute('max', range.max);
  element.setAttribute('value', rangeValue < 0 ? '0' : rangeValue);
  element.setAttribute('class', 'slider range');
  element.addEventListener("change", function() {
    socket.emit(item, { value: parseInt(this.value) } );
  });
  socket.on(item, function(value) {
    element.value = value;
  });
  return element;
}

function makeServoButtons(item, id, data, values) {
  var container = document.createElement('div');
  container.setAttribute('class', 'controlButtons');
  var buttonContainer = document.createElement('div');
  buttonContainer.setAttribute('class', 'buttonContainer');
  Object.keys(values).forEach( (key) => {
    var button = document.createElement('button');
    button.setAttribute('id', id + '_' + key.replace(/ /g, '_'));
    button.setAttribute('name', id + '_' + key.replace(/ /g, '_'));
    button.setAttribute('value', values[key]);
    button.setAttribute('class', 'button');
    var buttonText = document.createTextNode(key);
    button.appendChild(buttonText);
    button.addEventListener("click", function() {
      socket.emit(item, { value: parseInt(this.value) } );
    });
    buttonContainer.appendChild(button);
  });
  container.appendChild(buttonContainer);
  return container;
}

function makeBUTTON (item, id, data) {
console.log('making button ' + item);
  var div = document.createElement('div');
  div.setAttribute('class', data.type + '_status');
  var element = document.createElement('input');
  element.setAttribute('id', id + '_checkbox');
  element.setAttribute('type', 'checkbox');
  div.appendChild(element);
  socket.on(item, function(value) {
    console.log('button value:: ' + value);
    element.checked = value === 1;
  });
  return div;
}

var addRule = (function (style) {
  var sheet = document.head.appendChild(style).sheet;
  return function (selector, css) {
    var propText = typeof css === "string" ? css : Object.keys(css).map(function (p) {
      return p + ":" + (p === "content" ? "'" + css[p] + "'" : css[p]);
    }).join(";");
    sheet.insertRule(selector + "{" + propText + "}", sheet.cssRules.length);
  };
})(document.createElement("style"));

function hexToRgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    red: parseInt(result[1], 16),
    green: Math.round(parseInt(result[2], 16) / 5),
    blue: Math.round(parseInt(result[3], 16) / 5)
  } : null;
}

function componentToHex(c) {
  var hex = "00";
  if (c) {
    hex = c.toString(16);
  }
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(color) {
  var hex = '';
  if (Object.keys(color)[0] == 'yellow') {
    hex += componentToHex(color.yellow);
    hex += hex;
    hex += '00';
  } else {
    ['red', 'green', 'blue'].forEach(function(rgb) {
      var col = color[rgb];
      if (typeof col == 'string') {
        col = parseInt(col);
      }
      col = rgb != 'red' ? Math.min(col * 5, 255) : col;
      hex += componentToHex(col);
    });
  }
  return "#" + hex;
}

function setRgbColor(id, color) {
  ['red', 'green', 'blue'].forEach(function(rgb) {
    document.getElementById(id + '_' + rgb).value = color[rgb];
  });
  document.getElementById(id + '_picker').setAttribute('value', rgbToHex(color));
}

