/*
 * class for a controlling a LED on GPIO
 */

'use strict';

var Gpio = require('pigpio').Gpio;

class Led {

  constructor(pin, color, range = { min: 0, max: 255}, onValue = 1) {
    this.pin = pin;
    this.color = color;
    this.onValue = onValue;
    this.offValue = onValue === 1 ? 0 : 1;
    this.LED = new Gpio(this.pin, {mode: Gpio.OUTPUT});
    this.value = this.offValue;
    this.pwmValue = -1;
    this.pwmMin = range.min;
    this.pwmMax = range.max;
    this.smoothUp = false;
    this.off();
  }

  pwmWrite(value) {
    this.value = -1;
    this.pwmValue = value;
    this.LED.pwmWrite(value);
  }

  on() {
    this.value = this.onValue;
    this.pwmValue = this.pwmMax;
    this.LED.pwmWrite(this.pwmMax);
  }

  off() {
    this.smoothOff();
    this.blinkOff();
    this.value = this.offValue;
    this.pwmValue = this.pwmMin;
    this.LED.digitalWrite(this.offValue);
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
    this.timeout = undefined;
  }

  smooth(interval) {
    this.timeout = 1.0 * interval / this.pwmMax;
    this.smoothInterval = setInterval(this.smoothUpDown.bind(this), this.timeout);
  }

  smoothUpDown () {
    var diff = 0;
    if (this.smoothUp && this.pwmValue < this.pwmMax) {
      diff = 1;
    } else {
      if (this.smoothUp || this.pwmValue > this.pwmMin) {
        this.smoothUp = false;
      } else {
        this.smoothUp = true;
      }
      diff = -1;
    }
    this.pwmValue += diff;
    this.LED.pwmWrite(this.pwmValue);
  }

  smoothOff() {
    if (this.smoothInterval) {
      clearInterval(this.smoothInterval);
    }
    this.timeout = undefined;
  }
  
  toString() {
    return this.color + ' Led on pin ' + this.pin +
        (this.blinkInterval ? ' is blinking' : (
         this.pwmValue >= 0 ? ' has pwmValue ' + this.pwmValue : 
         this.value == this.onValue ? ' is on' : (
         this.value == this.offValue ? ' is off' : ' undefined'))
        );
  }
  
  getData() {
    return {
      type: 'LED',
      range: { min: this.pwmMin, max: this.pwmMax },
      pins: this.pins,
      color: this.color,
      pwmValue: this.pwmValue < 0 ? 0 : this.pwmValue,
      blinking: this.blinkInterval ? true : false,
      on: this.value == this.onValue ? true : (
          this.value == this.offValue ? false : undefined)
    };
  }
}

module.exports = Led;

