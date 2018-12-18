/*
 * class for a controlling a servo on GPIO
 */

'use strict';

const Gpio = require('pigpio').Gpio;

class Servo {

  constructor(data) {
    const range = { min: 1000, max: 2000 };
    this.pin = data.gpio;
    this.Servo = new Gpio(this.pin, { mode: Gpio.OUTPUT });
    this.rangeMin = range.min;
    this.rangeMax = range.max;
    this.midValue = (range.min + range.max) / 2;
    this.rangeValue = this.midValue;
    this.reset();
  }

  servoWrite(value) {
    this.rangeValue = value;
    this.Servo.servoWrite(value);
  }

  reset() {
    this.rangeValue = this.midValue;
    this.Servo.servoWrite(this.midValue);
  }

  toString() {
    return 'Servo on pin ' + this.pin + ' has rangeValue ' + this.rangeValue;
  }

  getData() {
    return {
      type: 'Servo',
      range: { min: this.rangeMin, max: this.rangeMax },
      pin: this.pin,
      pwmValue: this.rangeValue < 0 ? 0 : this.rangeValue,
      midValue: this.midValue,
    };
  }

  setValue(data) {
    if ('pwmValue' in data) {
      this.servoWrite(data.pwmValue);
    } else {
      console.log('setValue no usable value:', data);
    }
  }
}

module.exports = Servo;
