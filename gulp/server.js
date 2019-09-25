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

const fs = require('fs'),
  spawn = require('child_process').spawn,
  gulp = require('gulp'),
  changedInPlace = require('gulp-changed-in-place'),
  server = require('gulp-develop-server'),
  livereload = require('gulp-livereload'),
  sequence = require('gulp-sequence'),
  path = require('path'),
  config = require('../lib/config'),
  ipv4addresses = require('../lib/ipv4addresses'),
  loadTasks = require('./lib/load-tasks'),
  log = require('../lib/log'),
  notify = require('./lib/notify');

const baseDir = path.join(__dirname, '..');

let gpioServer;

const tasks = {
  /**
   * Start all configured server tasks for current NODE_ENV setting
   *
   * @function server
   * @param {function} callback - gulp callback to signal end of task
   */
  'server': [['eslint'], (callback) => {
    sequence(
      ...config.gulp.start[process.env.NODE_ENV].server,
      callback
    );
  }],
  /**
   * ### gpio server start task
   *
   * @task gpio-start
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'gpio-start': (callback) => {
    gpioServer = spawn('sudo', ['node', 'gpio/index.js'], { cwd: baseDir });
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
    kill.on('close', () => { // jscs:ignore jsDoc
      callback();
    });
  },
  /**
   * Server start task
   *
   * @function server-start
   * @param {function} callback - gulp callback to signal end of task
   */
  'server-start': (callback) => {
    server.listen({
      path: config.server.server,
      env: { VERBOSE: true, FORCE_COLOR: 1 },
      delay: 9000
    },
    callback);
  },
  /**
   * Server changed task restarts server
   *
   * @function server-changed
   * @param {function} callback - gulp callback to signal end of task
   */
  'server-changed': (callback) => {
    server.changed((error) => {
      if (!error) {
        livereload.changed({ path: '/', quiet: false });
      }
      callback();
    });
  },
  /**
   * Server livereload task notifies clients
   *
   * @function livereload
   */
  'livereload': () => {
    return gulp.src(config.gulp.watch.livereload)
      .pipe(changedInPlace({ howToDetermineDifference: 'modification-time' }))
      .pipe(notify({ message: '<%= file.path %>', title: 'livereload' }))
      .pipe(livereload({ quiet: false }));
  },
  /**
   * Trigger of livereload task with first file configured for livereload
   *
   * used for full page reload if js or locales change
   *
   * @function livereload-all
   */
  'livereload-all': () => {
    return gulp.src(config.gulp.watch.livereload[0])
      .pipe(notify({ message: 'triggered', title: 'livereload' }))
      .pipe(livereload({ quiet: false }));
  },
  /**
   * Livereload server start task
   *
   * @function livereload-start
   */
  'livereload-start': () => {
    livereload.listen({
      host: ipv4addresses.get()[0],
      port: '8081',
      quiet: false,
      key: fs.readFileSync(path.join(__dirname, '..', config.server.httpsKey)),
      cert: fs.readFileSync(path.join(__dirname, '..', config.server.httpsCert))
    });
    log.info('livereload listening on http://' + ipv4addresses.get()[0] + ':' + process.env.LIVERELOAD_PORT);
  }
};

loadTasks.importTasks(tasks);
