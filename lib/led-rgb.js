/*
 * configuration for a RGB LED
 */

'use strict';

module.exports = {
  LED : {},
  onValue: 1,
  init: function(redPin, greenPin, bluePin, onValue = 1) {
    this.LED.redPin = redPin;
    this.LED.greenPin = greenPin;
    this.LED.bluePin = bluePin;
    this.onValue = onValue;
    this.offValue = onValue === 1 ? 0 : 1;
  },
  setPWM: function(redVal, greenVal, blueVal) {
  
  }
};
