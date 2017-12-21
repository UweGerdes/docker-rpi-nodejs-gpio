/*
 * configuration for a RGB LED
 */

'use strict';

var led = require('./led');

module.exports = {
  LED : {},
  onValue: 1,
  init: function(redPin, greenPin, bluePin, onValue = 1) {
    this.LED.red = led.init(redPin);
    this.LED.greenPin = greenPin;
    this.LED.bluePin = bluePin;
    this.onValue = onValue;
    this.offValue = (onValue === 1) ? 0 : 1;
  },
  setPWM: function(redVal, greenVal, blueVal) {
  
  }
};
