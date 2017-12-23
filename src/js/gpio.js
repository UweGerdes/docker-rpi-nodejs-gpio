
'use strict';

/* jshint browser: true */
/* globals socket */
//var socket = io(); //loaded in html

var data;
var container;
var changedPicker = false;

socket.on('data', function(result) {
  console.log('data received');
  data = result;
  if (container) {
    createElements(container, data);
  }
});

window.addEventListener("load", documentLoaded);

function documentLoaded() {
  console.log('document loaded');
  container = document.getElementById('elementContainer');
  if (data) {
    createElements(container, data);
  }
}

function createElements(container, data) {
  if (container.childNodes.length > 0) {
    console.log('removing elements');
    container.removeChild(container.childNodes[0]);
  }
  console.log('creating elements');
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
  newDiv.appendChild(makePreview(item, id, data.type, data.color, data.pwmValue));
  newDiv.appendChild(newLabel);
  newDiv.appendChild(elementTypes[data.type](item, id, data));
  return newDiv;
}

var elementTypes = {
  LED: makeLED,
  RGBLED: makeRGBLED
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
  console.log('color: ', data);
  element.addEventListener("change", function() {
    console.log('color: ' + this.value + ' = %o', hexToRgb(this.value) );
    changedPicker = true;
    var color = hexToRgb(this.value);
    Object.keys(color).forEach( (col) => {
      socket.emit(item, { color: col, pwmValue: color[col] });
    });
  });
  newControls.appendChild(element);
  socket.on(item, function(result) {
    var color = result;
    console.log(id + ' received: ' + Object.values(color).join(', '));
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
    console.log(id + '_preview received: %o', data);
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
  console.log(Object.keys(color)[0]);
  if (Object.keys(color)[0] == 'yellow') {
    hex += componentToHex(color.yellow);
    hex += hex;
    hex += '00';
    console.log(hex);
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
  console.log('setting ' + id + ' color: (' + color.red + ', ' + color.green + ', ' + color.blue + ') = ' + rgbToHex(color));
  ['red', 'green', 'blue'].forEach(function(rgb) {
    document.getElementById(id + '_' + rgb).value = color[rgb];
  });
  document.getElementById(id + '_picker').setAttribute('value', rgbToHex(color));
}

window.addEventListener("load", function(){
  var servoSlider = document.getElementById("servoSlider");
  var servoButtons = document.getElementsByName('servo');

  servoSlider.addEventListener("change", function() {
    socket.emit("servo", {'value': this.value + '00'});
  });
  servoButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      socket.emit("servo", {'value': button.value});
    });
  });
});
