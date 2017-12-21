/*
 * class for a controlling a LED on GPIO
 */

'use strict';

var Gpio = require('pigpio').Gpio;

class Led {

  constructor(pin, onValue = 1) {
    this.pin = pin;
    this.onValue = onValue;
    this.offValue = onValue === 1 ? 0 : 1;
    this.LED = new Gpio(this.pin, {mode: Gpio.OUTPUT});
  }

  setPWM(value) {
    this.LED.pwmWrite(value);
  }

  on() {
    this.LED.digitalWrite(this.onValue);
  }

  off() {
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
    clearInterval(this.blinkInterval);
    this.off();
    this.timeout = undefined;
  }
}

module.exports = Led;

