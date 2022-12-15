/**
 * signal sensor touch
 *
 * sensor pin pull up to +3.3 V with 20 M Ohm resistor, touch to pull down and execute callback
 */

'use strict';

const Gpio = require('pigpio').Gpio;

class Sensor {

  constructor(data, callback) {
    this.pin = data.gpio;
    this.value = 0;
    this.Sensor = new Gpio(this.pin, {
      mode: Gpio.INPUT,
      pullUpDown: Gpio.PUD_DOWN,
      edge: Gpio.FALLING_EDGE
    });
    this.timeout = null;
    this.Sensor.on('interrupt', (value) => { // jscs:ignore jsDoc
      if (this.timeout === null && value === 0) {
        this.timeout = setTimeout(() => { this.timeout = null; }, 500); // jscs:ignore jsDoc
        callback(true);
      }
    });
  }

  getData() {
    return {
      type: 'Sensor',
      pin: this.pin,
      touched: this.timeout !== null
    };
  }
}

module.exports = Sensor;
