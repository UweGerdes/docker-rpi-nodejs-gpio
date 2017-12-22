/*
 * class for a controlling a LED on GPIO
 */

'use strict';

var Gpio = require('pigpio').Gpio;

class Led {

  constructor(pin, color, range = { min: 0, max: 255}, onValue = 1) {
    this.pin = pin;
    this.color = color;
    this.value = 
    this.onValue = onValue;
    this.offValue = onValue === 1 ? 0 : 1;
    this.LED = new Gpio(this.pin, {mode: Gpio.OUTPUT});
    this.value = this.offValue;
    this.pwmValue = -1;
    this.pwmMin = range.min;
    this.pwmMax = range.max;
    this.off();
  }

  pwmWrite(value) {
    this.value = -1;
    this.pwmValue = value;
    this.LED.pwmWrite(value);
  }

  on() {
    this.value = this.onValue;
    this.pwmValue = -1;
    this.LED.digitalWrite(this.onValue);
  }

  off() {
    this.value = this.offValue;
    this.pwmValue = -1;
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
    this.off();
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
      capabilites: { state: [ 0, 1 ] },
      range: { min: this.pwmMin, max: this.pwmMax },
      pin: this.pin,
      color: this.color,
      blinking: this.blinkInterval ? true : false,
      pwmValue: this.pwmValue,
      on: this.value == this.onValue ? true : (
          this.value == this.offValue ? false : undefined)
    };
  }
}

module.exports = Led;

