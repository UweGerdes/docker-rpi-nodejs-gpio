/**
 * Test for gpio page elements
 */

'use strict';

const chai = require('chai'),
  chaiHttp = require('chai-http'),
  jsdom = require('jsdom'),
  assert = chai.assert,
  expect = chai.expect,
  { JSDOM } = jsdom;

chai.use(chaiHttp);

describe('/gpio/tests/server/servo.js', function () {
  describe('GET /gpio/', function () {
    it('should have servos', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const servos = document.querySelectorAll('.gpio-item-servo');
          assert.equal(servos.length, 1);
          done();
        });
    });
    it('should have servo headline', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const servoLabels = document.querySelectorAll('.gpio-item-servo .gpio-item-label');
          assert.equal(servoLabels.length, 1);
          assert.equal(servoLabels[0].textContent, 'Servo 1');
          done();
        });
    });
    it('should have servo slider', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const servoSliders = document.querySelectorAll('.gpio-item-servo .gpio-item-slider');
          assert.equal(servoSliders.length, 1);
          assert.equal(servoSliders[0].getAttribute('data-group'), 'Servo');
          assert.equal(servoSliders[0].getAttribute('data-name'), 'Servo 1');
          assert.equal(servoSliders[0].getAttribute('data-type'), 'Servo');
          done();
        });
    });
  });
});
