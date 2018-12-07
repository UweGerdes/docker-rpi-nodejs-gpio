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
      blue: { min: 1, max: 51 }
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
      console.log('this[color]', typeof this[color]);
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

  onOff(timeout) {
    this.timeout = timeout || this.timeout;
    this.on();
    setTimeout(this.off.bind(this), this.timeout);
  }

  blink(interval) {
    this.timeout = interval / 2;
    this.blinkInterval = setInterval(this.onOff.bind(this), interval);
  }

  blinkOff() {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
    }
    this.off();
    this.timeout = undefined;
  }

  smooth(timeouts) {
    this.red.smooth(timeouts.red);
    this.green.smooth(timeouts.green);
    this.blue.smooth(timeouts.blue);
  }

  toString() {
    return 'RGB LED on pins ' + this.pins.red + ', ' + this.pins.green + ', ' + this.pins.blue +
      (this.blinkInterval ? ' is blinking' : (
        this.pwmValue >= 0 ? ' has color ' + this.color.red + ', ' + this.color.green + ', ' +
          this.color.blue :
        this.value == 1 ? ' is on' : (
        this.value == 0 ? ' is off' : ' undefined'))
      );
  }

  getData() {
    return {
      type: 'RGBLED',
      range: this.range,
      pin: this.pin,
      color: this.color,
      pwmValue: this.pwmValue,
      blinking: this.blinkInterval ? true : false,
      on: this.value == this.onValue ? true : (
          this.value == this.offValue ? false : undefined)
    };
  }

  setValue(data) {
    if (data.color && typeof data.color === 'string') {
      this.pwmValue[data.color] = data.pwmValue;
    } else if ('pwmValue' in data) {
      this.pwmValue = data.pwmValue;
    } else {
      console.log('setValue no usable value:', typeof data.pwmValue);
    }
    this.pwmWrite(this.pwmValue);
  }
}

module.exports = RGBLED;
