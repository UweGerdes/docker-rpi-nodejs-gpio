
'use strict';

const Gpio = require('pigpio').Gpio;

class Button {

  constructor(data, callback) {
    this.pin = data.gpio;
    this.value = 0;
    this.Button = new Gpio(this.pin, {
      mode: Gpio.INPUT,
      pullUpDown: Gpio.PUD_DOWN,
      edge: Gpio.EITHER_EDGE
    });
    this.Button.on('interrupt', (value) => { // jscs:ignore jsDoc
      this.value = value;
      callback(value);
    });
  }

  toString() {
    return 'Button on pin ' + this.pin + ' is ' + this.value;
  }

  getData() {
    return {
      type: 'Button',
      pin: this.pin,
      value: this.value,
    };
  }
}

module.exports = Button;
