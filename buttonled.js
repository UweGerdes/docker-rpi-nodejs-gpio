/**
 * Test LED and push button
 */

'use strict';

var Gpio = require('onoff').Gpio; // include onoff to interact with the GPIO
var red = new Gpio(27, 'out'); // use GPIO pin 27 as output
var yellow = new Gpio(17, 'out'); // use GPIO pin 17 as output
var pushButton1 = new Gpio(7, 'in', 'both'); // use GPIO pin 7 as input, and 'both' button presses, and releases should be handled
var pushButton2 = new Gpio(8, 'in', 'both'); // use GPIO pin 8 as input, and 'both' button presses, and releases should be handled

pushButton1.watch(function (err, value) { // Watch for hardware interrupts on pushButton GPIO, specify callback function
  if (err) { // if an error
    console.error('There was an error', err); // output error message to console
    return;
  }
  console.log('button1 ' + value);
  red.writeSync(value); // turn red on or off depending on the button state (0 or 1)
});

pushButton2.watch(function (err, value) { // Watch for hardware interrupts on pushButton GPIO, specify callback function
  if (err) { // if an error
    console.error('There was an error', err); // output error message to console
    return;
  }
  console.log('button2 ' + value);
  yellow.writeSync(value); // turn yellow on or off depending on the button state (0 or 1)
});

function unexportOnClose() { // function to run when exiting program
  red.writeSync(0); // Turn red off
  red.unexport(); // Unexport red GPIO to free resources
  yellow.writeSync(0); // Turn yellow off
  yellow.unexport(); // Unexport yellow GPIO to free resources
  pushButton1.unexport(); // Unexport Button GPIO to free resources
  pushButton2.unexport(); // Unexport Button GPIO to free resources
}

process.on('SIGINT', unexportOnClose); // function to run when user closes using ctrl+c
