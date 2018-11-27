/**
 * signal sensor touch
 *
 * sensor pin pull up to +3.3 V with 20 M Ohm resistor, touch to pull down and execute callback
 */

'use strict';

var Gpio = require('pigpio').Gpio;

class Sensor {

  constructor(pin, callback) {
    this.pin = pin;
    this.callback = callback;
    this.value = 0;
    this.SENSOR = new Gpio(this.pin, {
      mode: Gpio.INPUT,
      pullUpDown: Gpio.PUD_DOWN,
      edge: Gpio.FALLING_EDGE
    });
    this.timeout = null;
    this.SENSOR.on('interrupt', (value) => {
      if (this.timeout == null && value == 0) {
        this.timeout = setTimeout(() => {this.timeout = null;}, 500);
        this.callback();
      }
    });
  }

  toString() {
    return 'Sensor on pin ' + this.pin + ' is ' + this.value;
  }
  
  getData() {
    return {
      type: 'SENSOR',
      pin: this.pin,
    };
  }
}

module.exports = Sensor;

