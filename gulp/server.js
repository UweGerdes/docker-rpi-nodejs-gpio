/**
 * ## Gulp server tasks
 *
 * @module gulp/server
 */
'use strict';

const spawn = require('child_process').spawn,
  gulp = require('gulp'),
  changedInPlace = require('gulp-changed-in-place'),
  debug = require('gulp-debug'),
  server = require('gulp-develop-server'),
  livereload = require('gulp-livereload'),
  sequence = require('gulp-sequence'),
  wait = require('gulp-wait'),
  path = require('path'),
  config = require('../lib/config'),
  ipv4addresses = require('../lib/ipv4addresses.js'),
  loadTasks = require('./lib/load-tasks'),
  log = require('../lib/log')
  ;

const baseDir = path.join(__dirname, '..');

let gpioServer;

const tasks = {
  /**
   * ### server start and run tests
   *
   * @task server
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'server-restart': [['jshint'], (callback) => {
    if (process.env.NODE_ENV == 'development') {
      sequence(
        'gpio-stop',
        'gpio-start',
        'server-changed',
        'livereload-delayed',
        //'tests',
        callback
      );
    } else {
      sequence(
        'gpio-stop',
        'gpio-start',
        'server-changed',
        callback
      );
    }
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
   * ### server changed task
   *
   * @task server-changed
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'server-changed': (callback) => {
    server.changed((error) => { // jscs:ignore jsDoc
      if (error) {
        console.log('server-changed', error);
      }
      callback();
    });
  },
  /**
   * ### server livereload task
   *
   * @task livereload
   * @namespace tasks
   */
  'livereload': () => {
    console.log('livereload triggered');
    return gulp.src(config.gulp.watch.livereload)
      .pipe(debug({ title: 'livereload', showCount: false }))
      .pipe(changedInPlace({ howToDetermineDifference: 'modification-time' }))
      .pipe(livereload())
      ;
  },
  /**
   * ### trigger of livereload task with delay
   *
   * @task livereload-delayed
   * @namespace tasks
   */
  'livereload-delayed': () => {
    return gulp.src(config.gulp.watch.livereload[0])
      .pipe(wait(1000))
      .pipe(debug({ title: 'livereload', showCount: false }))
      .pipe(livereload())
      ;
  },
  /**
   * ### server livereload start task
   *
   * @task livereload-start
   * @namespace tasks
   */
  'livereload-start': () => {
    livereload.listen({
      port: config.server.livereloadPort || process.env.LIVERELOAD_PORT,
      delay: 2000,
      quiet: false
    });
    log.info('livereload listening on http://' +
      ipv4addresses.get()[0] + ':' + (config.server.livereloadPort || process.env.LIVERELOAD_PORT));
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
