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

describe('/gpio/tests/server/rgbled.js', function () {
  describe('GET /gpio/', function () {
    it('should have rgbleds', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const leds = document.querySelectorAll('.gpio-item-rgbled');
          assert.equal(leds.length, 3);
          done();
        });
    });
    it('should have rgbled headlines', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const ledLabels = document.querySelectorAll('.gpio-item-rgbled .gpio-item-label');
          assert.equal(ledLabels.length, 3);
          assert.equal(ledLabels[0].textContent, 'RGB LED 1');
          done();
        });
    });
    it('should have rgbled previews', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const ledPreviews = document.querySelectorAll('.gpio-item-rgbled .gpio-item-status');
          assert.equal(ledPreviews.length, 3);
          assert.equal(ledPreviews[0].getAttribute('data-group'), 'RGB LED');
          assert.equal(ledPreviews[0].getAttribute('data-name'), 'RGB LED 1');
          assert.equal(ledPreviews[0].getAttribute('data-type'), 'RGBLED');
          done();
        });
    });
    it('should have rgbled sliders', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const ledSliders = document.querySelectorAll('.gpio-item-rgbled .gpio-item-slider');
          assert.equal(ledSliders.length, 9);
          assert.equal(ledSliders[0].getAttribute('type'), 'range');
          assert.equal(ledSliders[0].getAttribute('data-group'), 'RGB LED');
          assert.equal(ledSliders[0].getAttribute('data-name'), 'RGB LED 1');
          assert.equal(ledSliders[0].getAttribute('data-type'), 'RGBLED');
          let led1Slider1 = document.querySelectorAll('.gpio-item-rgbled [id="RGB_LED 3_green_slider"]');
          assert.equal(led1Slider1.length, 1);
          assert.equal(ledSliders[0].getAttribute('name'), 'RGB_LED 1_red_slider');
          done();
        });
    });
  });
});
