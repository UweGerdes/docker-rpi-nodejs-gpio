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

describe('/gpio/tests/server/button.js', function () {
  describe('GET /gpio/', function () {
    it('should have buttons', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const buttons = document.querySelectorAll('.gpio-item-button');
          assert.equal(buttons.length, 1);
          done();
        });
    });
    it('should have button headlines', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const buttonLabels = document.querySelectorAll('.gpio-item-button .gpio-item-label');
          assert.equal(buttonLabels.length, 1);
          assert.equal(buttonLabels[0].textContent, 'Button 1');
          done();
        });
    });
    it('should have button status', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const buttonPreviews = document.querySelectorAll('.gpio-item-button .gpio-item-status');
          assert.equal(buttonPreviews.length, 1);
          assert.equal(buttonPreviews[0].getAttribute('data-group'), 'Button');
          assert.equal(buttonPreviews[0].getAttribute('data-name'), 'Button 1');
          assert.equal(buttonPreviews[0].getAttribute('data-type'), 'Button');
          done();
        });
    });
  });
});
