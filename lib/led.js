/*
 * configuration for a LED
 */

'use strict';

module.exports = {
  LED : undefined,
  onValue: 1,
  blinkInterval: undefined,
  init: function(pin, onValue = 1) {
    this.onValue = onValue;
    this.offValue = onValue === 1 ? 0 : 1;
    this.LED = new Gpio(this.LED.pin, {mode: Gpio.OUTPUT});
  },
  setPWM: function(value) {
    this.LED.pwmWrite(value);
  },
  on: function() {
    this.LED.digitalWrite(this.onValue);
  },
  off: function() {
    this.LED.digitalWrite(this.offValue);
  },
  onOff: function(timeout) {
    this.on();
    setTimeout(function() {
      this.off()
    }, timeout);
  },
  blink: function(interval) {
    this.blinkInterval = setInterval(function(interval) {
      this.onOff(interval/2);
    }, interval);
  },
  blinkOff: function(interval) {
    clearInterval(this.blinkInterval);
  }
};
