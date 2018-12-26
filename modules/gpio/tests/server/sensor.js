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

describe('/gpio/tests/server/sensor.js', function () {
  describe('GET /gpio/', function () {
    it('should have sensors', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const sensors = document.querySelectorAll('.gpio-item-sensor');
          assert.equal(sensors.length, 1);
          done();
        });
    });
    it('should have sensor headlines', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const sensorLabels = document.querySelectorAll('.gpio-item-sensor .gpio-item-label');
          assert.equal(sensorLabels.length, 1);
          assert.equal(sensorLabels[0].textContent, 'Sensor 1');
          done();
        });
    });
    it('should have sensor status', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const sensorPreviews = document.querySelectorAll('.gpio-item-sensor .gpio-item-status');
          assert.equal(sensorPreviews.length, 1);
          assert.equal(sensorPreviews[0].getAttribute('data-group'), 'Sensor');
          assert.equal(sensorPreviews[0].getAttribute('data-name'), 'Sensor 1');
          assert.equal(sensorPreviews[0].getAttribute('data-type'), 'Sensor');
          done();
        });
    });
  });
});
