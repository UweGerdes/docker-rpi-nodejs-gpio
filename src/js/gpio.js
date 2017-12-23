
'use strict';

/* jshint browser: true */
/* globals socket */
//var socket = io(); //loaded in html

var data;
var container;

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
  var newLabel = document.createElement('label');
  newLabel.setAttribute('for', id);
  newLabel.setAttribute('class', data.type + (data.color ? ' ' + data.color : ''));
  var newLabelText = document.createTextNode(item);
  newLabel.appendChild(newLabelText);
  newDiv.appendChild(newLabel);
  newDiv.appendChild(elementTypes[data.type](item, id, data));
  return newDiv;
}

var elementTypes = {
  LED: function(item, id, data) {
    var element = document.createElement('input');
    element.setAttribute('id', id);
    element.setAttribute('type', 'range');
    element.setAttribute('min', data.range.min);
    element.setAttribute('max', data.range.max);
    element.setAttribute('value', data.pwmValue < 0 ? '0' : data.pwmValue);
    element.setAttribute('class', 'slider ' + data.color);
    try {
      addRule('#' + id + '::-webkit-slider-thumb', { 'background': data.color } );
    } catch(e) { /* not webkit */ }
    try {
      addRule('#' + id + '::-moz-range-thumb', { 'background': data.color } );
    } catch(e) { /* not mozilla */ }
    element.addEventListener("change", function() {
      socket.emit(item, { pwmValue: this.value } );
    });
    return element;
  },
  RGBLED: function(item, id, data) {
    var container = document.createElement('div');
    ['red', 'green', 'blue'].forEach(function(color) {
      var element = document.createElement('input');
      element.setAttribute('id', id + '_' + color);
      element.setAttribute('type', 'range');
      element.setAttribute('min', data.range[color].min);
      element.setAttribute('max', data.range[color].max);
      element.setAttribute('value', data.color[color] < 0 ? '0' : data.color[color]);
      element.setAttribute('class', 'slider ' + color);
      try {
        addRule('#' + id + '_' + color + '::-webkit-slider-thumb', { 'background': color } );
      } catch(e) { /* not webkit */ }
      try {
        addRule('#' + id + '_' + color + '::-moz-range-thumb', { 'background': color } );
      } catch(e) { /* not mozilla */ }
      element.addEventListener("change", function() {
        socket.emit(item, { color: color, value: this.value } );
      });
      container.appendChild(element);
    });
    var element = document.createElement('input');
    element.setAttribute('id', id + '_picker');
    element.setAttribute('type', 'color');
    element.addEventListener("change", function() {
      console.log('color: ' + this.value);
      socket.emit(item, hexToRgb(this.value) );
    });
    container.appendChild(element);
    return container;
  }
};

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
    console.log(result[0]);
    return result ? {
        red: parseInt(result[1], 16),
        green: Math.round(parseInt(result[2], 16) / 5),
        blue: Math.round(parseInt(result[3], 16) / 5)
    } : null;
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

