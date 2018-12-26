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

describe('/gpio/tests/server/led.js', function () {
  describe('GET /gpio/', function () {
    it('should have leds', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const leds = document.querySelectorAll('.gpio-item-led');
          assert.equal(leds.length, 4);
          done();
        });
    });
    it('should have led headlines', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const ledLabels = document.querySelectorAll('.gpio-item-led .gpio-item-label');
          assert.equal(ledLabels.length, 4);
          assert.equal(ledLabels[0].textContent, 'LED 1');
          done();
        });
    });
    it('should have led previews', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const ledPreviews = document.querySelectorAll('.gpio-item-led .gpio-item-preview');
          assert.equal(ledPreviews.length, 4);
          assert.equal(ledPreviews[0].getAttribute('data-group'), 'LED');
          assert.equal(ledPreviews[0].getAttribute('data-name'), 'LED 1');
          assert.equal(ledPreviews[0].getAttribute('data-type'), 'LED');
          done();
        });
    });
    it('should have led sliders', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const ledSliders = document.querySelectorAll('.gpio-item-led .gpio-item-slider');
          assert.equal(ledSliders.length, 4);
          assert.equal(ledSliders[0].getAttribute('data-group'), 'LED');
          assert.equal(ledSliders[0].getAttribute('data-name'), 'LED 1');
          assert.equal(ledSliders[0].getAttribute('data-type'), 'LED');
          done();
        });
    });
  });
});
