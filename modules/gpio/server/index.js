/**
 * Routes for gpio
 *
 * @module gpio/index
 */

'use strict';

const router = require('express').Router(); // eslint-disable-line new-cap

const controller = require('./controller.js');

// gpio overview
router.get('/', controller.index);

module.exports = {
  router: router,
  setExpress: controller.setExpress
};
