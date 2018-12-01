/**
 * ## Gulp server tasks
 *
 * @module gulp/server
 */
'use strict';

const { spawn } = require('child_process'),
  gulp = require('gulp'),
  changedInPlace = require('gulp-changed-in-place'),
  server = require('gulp-develop-server'),
  livereload = require('gulp-livereload'),
  notify = require('gulp-notify'),
  sequence = require('gulp-sequence'),
  path = require('path'),
  config = require('../lib/config'),
  ipv4addresses = require('../lib/ipv4addresses.js'),
  loadTasks = require('./lib/load-tasks'),
  log = require('../lib/log')
  ;

const baseDir = path.join(__dirname, '..');

let gpioServer;

/**
 * log only to console, not GUI
 *
 * @param {pbject} options - setting options
 * @param {function} callback - gulp callback
 */
const pipeLog = notify.withReporter((options, callback) => {
  callback();
});

const tasks = {
  /**
   * ### server restart and run tests
   *
   * @task server
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'server-restart': [['jshint'], (callback) => {
    if (process.env.NODE_ENV == 'development') {
      sequence(
        'server-changed',
        //'tests',
        callback
      );
    } else {
      sequence(
        'server-changed',
        callback
      );
    }
  }],
  /**
   * ### server livereload task
   *
   * @task livereload
   * @namespace tasks
   */
  'livereload': () => {
    log.info('livereload triggered');
    return gulp.src(config.gulp.watch.livereload)
      .pipe(changedInPlace({ howToDetermineDifference: 'modification-time' }))
      .pipe(livereload())
      .pipe(pipeLog({ message: 'livereload: <%= file.path %>', title: 'Gulp livereload' }))
      ;
  },
  /**
   * ### gpio server start task
   *
   * @task gpio-start
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'gpio-restart': (callback) => {
    sequence(
      'gpio-stop',
      'gpio-start',
      callback
    );
  },
  /**
   * ### gpio server start task
   *
   * @task gpio-start
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'gpio-start': (callback) => {
    gpioServer = spawn('sudo', ['node', 'gpio.js'], { cwd: baseDir });
    gpioServer.stdout.on('data', (data) => { // jscs:ignore jsDoc
      console.log(`gpio stdout: ${data}`);
    });
    gpioServer.stderr.on('data', (data) => { // jscs:ignore jsDoc
      console.log(`stderr: ${data}`);
    });
    gpioServer.on('close', (code) => { // jscs:ignore jsDoc
      console.log(`child process exited with code ${code}`);
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
    const kill = spawn('sudo', ['pkill', '-f', 'sudo node gpio.js']);
    kill.on('close', (code) => { // jscs:ignore jsDoc
      console.log(`child process exited with code ${code}`);
      callback();
    });
  },
  /**
   * ### server start task
   *
   * @task server-start
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'server-start': (callback) => {
    server.listen({
        path: config.server.server,
        env: { VERBOSE: true, FORCE_COLOR: 1 }
      },
      callback
    );
  },
  /**
   * ### server restart task
   *
   * @task server-restart
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'server-changed': (callback) => {
    server.changed((error) => { // jscs:ignore jsDoc
      if (!error) {
        livereload.changed({ path: '/', quiet: false });
      }
      callback();
    });
  },
  /**
   * ### server livereload start task
   *
   * @task livereload-start
   * @namespace tasks
   */
  'livereload-start': () => {
    livereload.listen({ port: config.server.livereloadPort, delay: 2000, quiet: false });
    log.info('livereload listening on http://' +
      ipv4addresses.get()[0] + ':' + config.server.livereloadPort);
  }
};

process.once('SIGTERM', exitHandler);
process.once('SIGUSR2', exitHandler);

function exitHandler() { // jscs:ignore jsDoc
  console.log('stop gpio server');
  gpioServer.kill('SIGUSR2');
  setTimeout(() => { // jscs:ignore jsDoc
    console.log('shutting down gulp server');
    process.exit(0);
  }, 500);
}

loadTasks.importTasks(tasks);
