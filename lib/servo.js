/*
 * class for a controlling a servo on GPIO
 */

'use strict';

var Gpio = require('pigpio').Gpio;

class Servo {

  constructor(pin, range = { min: 1000, max: 2000}) {
    this.pin = pin;
    this.SERVO = new Gpio(this.pin, {mode: Gpio.OUTPUT});
    this.rangeMin = range.min;
    this.rangeMax = range.max;
    this.midValue = (range.min + range.max) / 2;
    this.rangeValue = this.midValue;
    this.reset();
  }

  servoWrite(value) {
    this.rangeValue = value;
    this.SERVO.servoWrite(value);
  }

  reset() {
    this.rangeValue = this.midValue;
    this.SERVO.servoWrite(this.midValue);
  }

  toString() {
    return 'SERVO on pin ' + this.pin + ' has rangeValue ' + this.rangeValue;
  }
  
  getData() {
    return {
      type: 'SERVO',
      range: { min: this.rangeMin, max: this.rangeMax },
      pin: this.pin,
      rangeValue: this.rangeValue < 0 ? 0 : this.rangeValue,
    };
  }
}

module.exports = Servo;

