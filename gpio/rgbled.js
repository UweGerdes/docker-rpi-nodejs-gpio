/*
 * configuration for a RGB LED
 */

'use strict';

const LED = require('./led.js');

class RGBLED {

  constructor(data) {
    this.pins = data.gpio;
    this.range = {
      red: { min: 1, max: 255 },
      green: { min: 1, max: 51 },
      blue: { min: 1, max: 102 }
    };
    this.color = ['red', 'green', 'blue'];
    this.red = new LED({ gpio: this.pins.red, color: 'red', range: this.range.red });
    this.green = new LED({ gpio: this.pins.green, color: 'green', range: this.range.green });
    this.blue = new LED({ gpio: this.pins.blue, color: 'blue', range: this.range.blue });
    this.pwmValue = { red: 0, green: 0, blue: 0 };
    this.off();
  }

  pwmWrite(value) {
    this.color.forEach((color) => { // jscs:ignore jsDoc
      this[color].pwmWrite(value[color]);
    });
  }

  on() {
    this.value = 1;
    this.red.on();
    this.pwmValue.red = this.range.red.max;
    this.green.on();
    this.pwmValue.green = this.range.green.max;
    this.blue.on();
    this.pwmValue.blue = this.range.blue.max;
  }

  off() {
    this.value = 0;
    this.red.off();
    this.pwmValue.red = 0;
    this.green.off();
    this.pwmValue.green = 0;
    this.blue.off();
    this.pwmValue.blue = 0;
  }

  smooth(timeout) {
    this.red.smooth(timeout + Math.random() * 1000);
    this.green.smooth(timeout + Math.random() * 1000);
    this.blue.smooth(timeout + Math.random() * 1000);
  }

  getData() {
    return {
      type: 'RGBLED',
      range: this.range,
      pin: this.pin,
      color: this.color,
      pwmValue: { red: this.red.pwmValue, green: this.green.pwmValue, blue: this.blue.pwmValue },
      smoothTimeout: this.red.smoothActive || this.green.smoothActive || this.blue.smoothActive
    };
  }

  setValue(data) {
    if (data.color && typeof data.color === 'string') {
      console.log('setValue:', data);
      this[data.color].setValue({ pwmValue: data.pwmValue });
    } else if ('pwmValue' in data) {
      for (const [color, pwmValue] of data.pwmValue) {
        this[color].setValue({ pwmValue: pwmValue });
      }
    } else {
      console.log('setValue no usable value:', data);
    }
    this.pwmWrite(this.pwmValue);
  }
}

module.exports = RGBLED;
