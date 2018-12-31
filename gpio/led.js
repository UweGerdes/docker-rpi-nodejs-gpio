/*
 * class for a controlling a LED on GPIO
 */

'use strict';

const Gpio = require('pigpio').Gpio;

class LED {

  constructor(data) {
    this.pin = data.gpio;
    this.color = data.color;
    this.onValue = data.onValue || 1;
    this.offValue = this.onValue === 1 ? 0 : 1;
    this.LED = new Gpio(this.pin, { mode: Gpio.OUTPUT });
    this.value = this.offValue;
    this.pwmValue = -1;
    this.pwmMin = data.range.min;
    this.pwmMax = data.range.max;
    this.smoothUp = false;
    this.smoothActive = false;
    this.off();
  }

  pwmWrite(value) {
    this.value = -1;
    this.pwmValue = value;
    this.LED.pwmWrite(value);
  }

  on() {
    this.smoothOff();
    this.value = this.onValue;
    this.pwmValue = this.pwmMax;
    this.LED.pwmWrite(this.pwmMax);
  }

  off() {
    this.smoothOff();
    this.value = this.offValue;
    this.pwmValue = this.pwmMin;
    this.LED.digitalWrite(this.offValue);
  }

  smooth(interval) {
    this.off();
    if (interval > 0) {
      this.pwmWrite(Math.floor(Math.random() * this.pwmMax + this.pwmMin));
      this.smoothInterval = setInterval(this.smoothUpDown.bind(this), 1.0 * interval / this.pwmMax);
      this.smoothActive = true;
    }
  }

  smoothUpDown () {
    let diff = 0;
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
    if (this.pwmValue < this.pwmMin || this.pwmValue > this.pwmMax) {
      this.pwmValue = this.pwmMin;
    } else {
      this.LED.pwmWrite(this.pwmValue);
    }
  }

  smoothOff() {
    if (this.smoothInterval) {
      clearInterval(this.smoothInterval);
      this.smoothInterval = undefined;
      this.smoothActive = false;
    }
  }

  getData() {
    return {
      type: 'LED',
      range: { min: this.pwmMin, max: this.pwmMax },
      pin: this.pin,
      color: this.color,
      pwmValue: this.pwmValue < 0 ? 0 : this.pwmValue,
      smoothTimeout: this.smoothActive
    };
  }

  setValue(data) {
    this.smoothOff();
    if ('pwmValue' in data) {
      this.pwmWrite(data.pwmValue);
    } else {
      console.log('setValue no usable value:', data);
    }
  }
}

module.exports = LED;
