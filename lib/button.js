
'use strict';

var Gpio = require('pigpio').Gpio;

class Button {

  constructor(pin, callback) {
    this.pin = pin;
    this.callback = callback;
    this.value = 0;
    this.BUTTON = new Gpio(this.pin, {
      mode: Gpio.INPUT,
      pullUpDown: Gpio.PUD_DOWN,
      edge: Gpio.EITHER_EDGE
    });
    this.BUTTON.on('interrupt', (value) => {
      this.value = value;
      this.callback(value);
    });
  }

  toString() {
    return 'Button on pin ' + this.pin + ' is ' + this.value;
  }
  
  getData() {
    return {
      type: 'BUTTON',
      pin: this.pin,
      value: this.value,
    };
  }
}

module.exports = Button;

