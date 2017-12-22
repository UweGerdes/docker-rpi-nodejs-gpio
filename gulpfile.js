/*
 * gulpfile for Raspberry Pi GPIO with Node.js
 *
 * (c) Uwe Gerdes, entwicklung@uwegerdes.de
 */
'use strict';

var exec = require('child_process').exec,
  glob = require('glob'),
  gulp = require('gulp'),
  autoprefixer = require('gulp-autoprefixer'),
  jshint = require('gulp-jshint'),
  less = require('gulp-less'),
  lesshint = require('gulp-lesshint'),
  notify = require('gulp-notify'),
  postMortem = require('gulp-postmortem'),
  uglify = require('gulp-uglify'),
  gutil = require('gulp-util'),
  path = require('path'),
  runSequence = require('run-sequence'),
  sudo = require('sudo')
  ;

var baseDir = __dirname;
var libDir = path.join(baseDir, 'lib');
var srcDir = path.join(baseDir, 'src');
var destDir = path.join(baseDir, 'public');
var watchFilesFor = {};

/*
 * log only to console, not GUI
 */
var log = notify.withReporter(function (options, callback) {
  callback();
});

/*
 * less files lint
 */
watchFilesFor['less-lint'] = [
  path.join(srcDir, 'less', '**', '*.less')
];
gulp.task('less-lint', function () {
  return gulp.src( watchFilesFor['less-lint'] )
    .pipe(lesshint())
    .on('error', function (err) {})
    .pipe(lesshint.reporter())
    ;
});

/*
 * compile less files
 */
watchFilesFor.less = [
  path.join(srcDir, 'less', '**', '*.less'),
  path.join(srcDir, 'less', 'gpio.less')
];
gulp.task('less', function () {
  var src = watchFilesFor.less.filter(function(el){return el.indexOf('/**/') == -1; });
  return gulp.src(src)
    .pipe(less())
    .on('error', log.onError({ message:  'Error: <%= error.message %>' , title: 'LESS Error'}))
    .pipe(autoprefixer('last 3 version', 'safari 5', 'ie 8', 'ie 9', 'ios 6', 'android 4'))
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
    .pipe(gulp.dest(path.join(destDir, 'css')))
    .pipe(log({ message: 'written: <%= file.path %>', title: 'Gulp less' }))
    ;
});

/*
 * lint javascript files
 */
watchFilesFor.jshint = [
  path.join(baseDir, 'package.json'),
  path.join(baseDir, '*.js'),
  path.join(libDir, '*.js'),
  path.join(srcDir, 'js', '*.js')
];
gulp.task('jshint', function(callback) {
  return gulp.src(watchFilesFor.jshint)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    ;
});

/**
 * Copy the src/js files to public/js
 */
watchFilesFor.js = [
  path.join(srcDir, 'js', '**', '*.js')
];
gulp.task('js', () => {
  return gulp.src( watchFilesFor.js )
    .pipe(gulp.dest(path.join(destDir, 'js')))
    .pipe(log('written: <%= file.path %>'))
    ;
});

/*
 * run all build tasks
 */
gulp.task('build', function(callback) {
  runSequence('less-lint',
    'less',
    'jshint',
    'js',
    callback);
});


var myServer = {
  cmd: undefined,
  start: function(cmd) {
    if (typeof cmd === 'string') {
      this.cmd = cmd.split(/ /);
    } else {
      this.cmd = cmd;
    }
    this.kill();
    console.log('starting ' + this.cmd.join(' '));
    var child = sudo(this.cmd, {});
    child.stdout.on('data', function (data) {
      console.log(data.toString());
    });
    child.stderr.on('data', function (data) {
      console.error(data.toString());
    });
    child.on('close', function () {
      console.log('process exited');
    });
  },
  kill: function() {
    if (this.cmd !== undefined && this.cmd.length > 0) {
      var child = exec('ps ax');
      var cmd = this.cmd.join(' ');
      child.stdout.on('data', function (data) {
        data.split('\n')
          .forEach(function(line) {
            if (line.match('[0-9] ' + cmd)) {
              var pid = line.replace(/^.*?([0-9]+).*/, '$1');
              var kill = sudo([ 'kill', pid], {});
              kill.on('close', function () {
                console.log('killed old server process');
              });
            }
        });
      });
    }
  }
};

/*
 * restart server if server.js changed
 */
watchFilesFor.server = [
  path.join(baseDir, 'server.js'),
  path.join(libDir, '*.js')
];
gulp.task('server', function() {
  myServer.start('node ' + path.join(baseDir, 'server.js'));
});

/*
 * stop server
 */
gulp.task('server:stop', function() {
  myServer.kill();
});

/*
 * gulp postmortem task to stop server on termination of gulp
 */
gulp.task('server-postMortem', function() {
  console.log('server-postMortem');
  return gulp.src( watchFilesFor.server )
    .pipe(postMortem({gulp: gulp, tasks: [ 'server:stop' ]}))
    ;
});

/*
 * watch task
 */
gulp.task('watch', function() {
  Object.keys(watchFilesFor).forEach(function(task) {
    watchFilesFor[task].forEach(function(filename) {
      glob(filename, function(err, files) {
        if (err) {
          console.log(filename + ' error: ' + JSON.stringify(err, null, 4));
        }
        if (files.length === 0) {
          console.log(filename + ' not found');
        }
      });
    });
    gulp.watch( watchFilesFor[task], [ task ] );
  });
});

/*
 * default task: run all build tasks and watch
 */
gulp.task('default', function(callback) {
  runSequence(//'build',
    'server',
    'watch',
    'server-postMortem',
    callback);
});

module.exports = {
  gulp: gulp,
  watchFilesFor: watchFilesFor
};

