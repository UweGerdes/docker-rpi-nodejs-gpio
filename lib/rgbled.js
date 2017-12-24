/*
 * configuration for a RGB LED
 */

'use strict';

const Led = require('./led.js');

class RGBLed {

  constructor(pins, range = { red: { min: 1, max: 255}, green: { min: 1, max: 51}, blue: { min: 1, max: 51} }, onValue = 1) {
    this.pins = pins;
    this.range = range;
    this.color = ['red', 'green', 'blue'];
    this.red = new Led(pins.red, 'red', range.red);
    this.green = new Led(pins.green, 'green', range.green);
    this.blue = new Led(pins.blue, 'blue', range.blue);
    this.pwmValue = { red: 0, green: 0, blue: 0 };
    this.off();
  }

  pwmWrite(value) {
    if (value.color === 'red') {
      this.red.pwmWrite(value.pwmValue);
      this.pwmValue.red = value.pwmValue;
    }
    if (value.color === 'green') {
      this.green.pwmWrite(value.pwmValue);
      this.pwmValue.green = value.pwmValue;
    }
    if (value.color === 'blue') {
      this.blue.pwmWrite(value.pwmValue);
      this.pwmValue.blue = value.pwmValue;
    }
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
    return 'RGB Led on pins ' + this.pins.red + ', ' + this.pins.green + ', ' + this.pins.blue +
        (this.blinkInterval ? ' is blinking' : (
         this.pwmValue >= 0 ? ' has color ' + this.color.red + ', ' + this.color.green + ', ' + this.color.blue : 
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
}

module.exports = RGBLed;

