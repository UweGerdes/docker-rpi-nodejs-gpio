/**
 * Gulp server tasks
 *
 * @module gulp/server
 * @requires module:lib/config
 * @requires module:lib/ipv4addresses
 * @requires module:gulp/lib/files-promises
 * @requires module:gulp/lib/load-tasks
 * @requires module:gulp/lib/notify
 */

'use strict';

const spawn = require('child_process').spawn,
  path = require('path');

const baseDir = path.join(__dirname, '..');

let gpioServer;

const tasks = {
  /**
   * ### gpio server start task
   *
   * @task gpio-start
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'gpio-start': (callback) => {
    console.log('starting gpio server');
    gpioServer = spawn('sudo', ['node', 'bin/index.js'], { cwd: baseDir });
    gpioServer.stdout.on('data', (data) => { // jscs:ignore jsDoc
      console.log(`gpio stdout: ${data}`);
    });
    gpioServer.stderr.on('data', (data) => { // jscs:ignore jsDoc
      if (data.indexOf('sigHandler: Unhandled signal 15, terminating') < 0) {
        console.log(`gpio stderr: ${data}`);
      }
    });
    gpioServer.on('close', (code) => { // jscs:ignore jsDoc
      console.log(`gpio process exited with code ${code}`);
    });
    callback();
  },
  /**
   * ### gpio server stop task
   *
   * @task gpio-stop
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'gpio-stop': (callback) => {
    const kill = spawn('sudo', ['pkill', '-f', 'sudo node gpio/index.js']);
    kill.on('close', () => { // xxxjscs:ignore jsDoc
      callback();
    });
  },
  /**
   * ### gpio server stop task
   *
   * @task gpio-stop
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'gpio-test': (callback) => {
    console.log('gpio-test');
    callback();
  }
};

module.exports = tasks;
