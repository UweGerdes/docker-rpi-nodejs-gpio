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

describe('/gpio/tests/server/index.js', function () {
  describe('GET /gpio/', function () {
    it('should have head', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          assert.equal(document.title, 'gpio');
          done();
        });
    });
    it('should have headline and script', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const headline = document.getElementById('headline');
          assert.equal(headline.textContent, 'Raspberry Pi 3 GPIO');
          const gpioScript = document.querySelectorAll('script[src="/js/gpio/gpio.js"]');
          assert.equal(gpioScript.length, 1);
          done();
        });
    });
    it('should have buttons', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const buttonsContainer = document.querySelectorAll('.gpio-buttons');
          assert.equal(buttonsContainer.length, 1);
          const buttons = document.querySelectorAll('.gpio-button');
          assert.equal(buttons.length, 5);
          assert.equal(buttons[0].textContent, 'alle aus');
          assert.equal(buttons[1].textContent, 'alle an');
          assert.equal(buttons[2].textContent, 'smooth');
          assert.equal(buttons[3].textContent, 'LED smooth');
          assert.equal(buttons[4].textContent, 'RGB smooth');
          done();
        });
    });
    it('should have groups', function (done) {
      chai.request('http://localhost:8080')
        .get('/gpio/')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          const { document } = (new JSDOM(res.text)).window;
          const groupsContainer = document.querySelectorAll('.gpio-groups');
          assert.equal(groupsContainer.length, 1);
          const groups = document.querySelectorAll('.gpio-group');
          assert.equal(groups.length, 5);
          done();
        });
    });
  });
});
