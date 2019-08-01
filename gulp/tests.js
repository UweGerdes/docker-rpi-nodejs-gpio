/**
 * Gulp test tasks
 *
 * @module gulp/tests
 * @requires module:lib/config
 * @requires module:gulp/lib/files-promises
 * @requires module:gulp/lib/load-tasks
 * @requires module:gulp/lib/notify
 */

'use strict';

const gulp = require('gulp'),
  mocha = require('gulp-mocha'),
  sequence = require('gulp-sequence'),
  gulpStreamToPromise = require('gulp-stream-to-promise'),
  config = require('../lib/config'),
  filePromises = require('./lib/files-promises'),
  loadTasks = require('./lib/load-tasks'),
  notify = require('./lib/notify');

const tasks = {
  /**
   * Start all tests configured for current NODE_ENV setting
   *
   * @function test
   * @param {function} callback - gulp callback to signal end of task
   */
  'tests': (callback) => {
    sequence(
      ...config.gulp.start[process.env.NODE_ENV].tests,
      callback
    );
  },
  /**
   * Start all tests configured in configuration gulp.test.modules
   *
   * @function test-modules
   * @param {function} callback - gulp callback to signal end of task
   */
  'test-modules': [['eslint', 'ejslint'], (callback) => {
    Promise.all(config.gulp.tests.modules.map(filePromises.getFilenames))
      .then((filenames) => [].concat(...filenames))
      .then(filePromises.getRecentFiles)
      .then((filenames) => {
        const task = gulp.src(filenames, { read: false })
          // `gulp-mocha` needs filepaths so you can't have any plugins before it
          .pipe(mocha({ reporter: 'tap', timeout: 10000 })) // timeout for Raspberry Pi 3
          .on('error', function (error) {
            task.emit(error);
          })
          .pipe(notify({ message: 'tested: <%= file.path %>', title: 'Gulp test' }));
        return gulpStreamToPromise(task);
      })
      .then(() => {
        callback();
      })
      .catch(err => console.log(err));
  }]
};

if (process.env.NODE_ENV === 'development') {
  loadTasks.importTasks(tasks);
}
