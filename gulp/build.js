/**
 * @module gulp/build
 */

'use strict';

const gulp = require('gulp'),
  autoprefixer = require('gulp-autoprefixer'),
  jsdoc = require('gulp-jsdoc3'),
  less = require('gulp-less'),
  rename = require('gulp-rename'),
  sequence = require('gulp-sequence'),
  lessPluginGlob = require('less-plugin-glob'),
  combiner = require('stream-combiner2'),
  config = require('../lib/config'),
  loadTasks = require('./lib/load-tasks'),
  notify = require('./lib/notify');

const tasks = {
  /**
   * ### Default gulp build task
   *
   * @task build
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'build': (callback) => {
    sequence(
      ...config.gulp.start[process.env.NODE_ENV].build,
      callback
    );
  },
  /**
   * #### Compile less files
   *
   * compile less files
   *
   * @task less
   * @namespace tasks
   */
  'less': () => {
    return combiner.obj([
      gulp.src(config.gulp.build.less.src),
      less({
        plugins: [lessPluginGlob]
      }),
      autoprefixer('last 3 version', 'safari 5', 'ie 8', 'ie 9', 'ios 6', 'android 4'),
      gulp.dest(config.gulp.build.less.dest),
      notify({ message: 'written: <%= file.path %>', title: 'Gulp less' })
    ])
      .on('error', () => { });
  },
  /**
   * #### Compile js files
   *
   * compile js files
   *
   * @task jsss
   * @namespace tasks
   */
  'js': () => {
    return gulp.src(config.gulp.build.js.src)
      .pipe(rename(function (path) {
        Object.keys(config.gulp.build.js.replace).forEach((key) => {
          path.dirname = path.dirname.replace(key, config.gulp.build.js.replace[key]);
        });
      }))
      .pipe(gulp.dest(config.gulp.build.js.dest))
      .pipe(notify({ message: 'written: <%= file.path %>', title: 'Gulp js' }));
  },
  /**
   * #### Compile jsdoc
   *
   * compile jsdoc
   *
   * @task jsdoc
   * @namespace tasks
   * @param {function} callback - gulp callback
   */
  'jsdoc': [['eslint'], (callback) => {
    const jsdocConfig = {
      'tags': {
        'allowUnknownTags': true
      },
      'opts': {
        'destination': config.gulp.build.jsdoc.dest
      },
      'plugins': [
        'plugins/markdown'
      ],
      'templates': {
        'cleverLinks': false,
        'monospaceLinks': false,
        'default': {
          'outputSourceFiles': 'true'
        },
        'path': 'ink-docstrap',
        'theme': 'cerulean',
        'navType': 'vertical',
        'linenums': true,
        'dateFormat': 'D.MM.YY, HH:mm:ss'
      }
    };
    gulp.src(config.gulp.build.jsdoc.src, { read: false })
      .pipe(jsdoc(jsdocConfig, callback));
  }]
};

loadTasks.importTasks(tasks);
