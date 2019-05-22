const assert = require('chai').assert;
const request = require("supertest");
const expect = require('chai').expect;
var should = require('chai').should();
var cheerio = require('cheerio');
var chai = require('chai'), chaiHttp = require('chai-http');
const app = require('../project');
chai.use(chaiHttp);
var agent = chai.request.agent(app)

describe('POST /login - 200', function () {
    it("Should deny login due to locked account", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'mjacinto',
            'password': 'mjacinto1'
        })
        .then(function (res) {
        return agent.get('/trading-success')
            .then(function (res) {
                var $ = cheerio.load(res.text);
                var display = $('title').text();
                assert.equal(display, "Login");
                expect(res).to.have.status(200);
                done();
            });
        });
    });
});

describe('GET /transactions - 200', function () {
    it("Should grant access to the transactions page", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'testaccount',
            'password': 'testaccount1'
        })
        .then(function (res) {
        return agent.get('/transactions')
            .then(function (res) {

                // checks if there is a 200 status when getting to the transactions page
                var $ = cheerio.load(res.text);
                var display = $('title').text();
                assert.equal(display, "Transactions");
                expect(res).to.have.status(200);
                done();
            });
        });
    });
});

describe('GET /profile - 200', function () {
    it("Should grant access to profile page", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'testaccount',
            'password': 'testaccount1'
        })
        .then(function (res) {
        return agent.get('/profile')
            .then(function (res) {

                // checks if there is a 200 status when getting to the profile page
                var $ = cheerio.load(res.text);
                var display = $('title').text();
                assert.equal(display, "Profile");
                expect(res).to.have.status(200);
                done();
            });
        });
    });
    it("Should pass if username matches form value", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'testaccount',
            'password': 'testaccount1'
        })
        .then(function (res) {
        return agent.get('/profile')
            .then(function (res) {

                // checks if username matches form value
                var $ = cheerio.load(res.text);

                var display = $('input[id=username]').attr('value');
                assert.equal(display, "testaccount");
                expect(res).to.have.status(200);
                done();
            });
        });
    });
    it("Should pass if firstname matches form value", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'testaccount',
            'password': 'testaccount1'
        })
        .then(function (res) {
        return agent.get('/profile')
            .then(function (res) {

                // checks if username matches form value
                var $ = cheerio.load(res.text);

                var display = $('input[id=firstname]').attr('value');
                assert.equal(display, "testeraccount");
                expect(res).to.have.status(200);
                done();
            });
        });
    });
});

describe('GET /home - 200', function () {
    it("Should grant access to Home page", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'testaccount',
            'password': 'testaccount1'
        })
        .then(function (res) {
        return agent.get('/home')
            .then(function (res) {

                // checks if there is a 200 status when getting to the Home Page
                var $ = cheerio.load(res.text);
                var display = $('title').text();
                assert.equal(display, "Home Page");
                expect(res).to.have.status(200);
                done();
            });
        });
    });

    it("Should return true if a valid link is returned", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'testaccount',
            'password': 'testaccount1'
        })
        .then(function (res) {
        return agent.get('/home')
            .then(function (res) {
                var $ = cheerio.load(res.text);

                // checks if links are valid
                for (var i = 1; i <= 5; i++) {
                    var display = $(`a[id=nurl${i}]`).attr('href');
                    var regex = /\b(https?:\/\/.*?\.[a-z]{2,4}\/[^\s]*\b)/g;
                    assert.match(display, regex);
                }

                expect(res).to.have.status(200);
                done();
            });
        });
    });

    it("Should return true if list is properly sorted", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'testaccount',
            'password': 'testaccount1'
        })
        .then(function (res) {
        return agent.get('/home')
            .then(function (res) {
                var $ = cheerio.load(res.text);

                var display = $('div[id=user_cash]').text();
                var rankings = display.split(" ");

                // checks that the list is properly ordered
                for (var i = 0; i < rankings.length - 2; i++) {
                    assert.isAtLeast(parseFloat(rankings[i]), parseFloat(rankings[i + 1]), 'num 1 must be >= num 2');
                }

                expect(res).to.have.status(200);
                done();
            });
        });
    });

    it("Should return true if valid links are returned after search", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'testaccount',
            'password': 'testaccount1'
        })
        .then(function (res) {
        return agent.post('/home')
        .send({
            '_method': 'post',
            'news_search': 'TSLA'
        })
            .then(function (res) {
                var $ = cheerio.load(res.text);

                var display = $('div[id=user_cash]').text();
                var rankings = display.split(" ");

                // checks that the list is properly ordered
                for (var i = 0; i < rankings.length - 2; i++) {
                    assert.isAtLeast(parseFloat(rankings[i]), parseFloat(rankings[i + 1]), 'num 1 must be >= num 2');
                }

                expect(res).to.have.status(200);
                done();
            });
        });
    });

});

describe('POST /login - 200', function () {
    it("Should successfully log in and access the trading page", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'testaccount',
            'password': 'testaccount1'
        })
        .then(function (res) {
        return agent.get('/trading-success')
            .then(function (res) {
                var $ = cheerio.load(res.text);
                var display = $('title').text();
                assert.equal(display, "Trading Page");
                expect(res).to.have.status(200);
                done()
            });
        });
    });
});

describe('GET /register - 200', function () {
  it("should return webpage with title of 'Registration Page' ", function (done) {
      request(app)
          .get('/register')
          .set('Accept', 'application/json')
          .expect('Content-Type', "text/html; charset=utf-8")
          .end(function(err, res) {
            expect(res).to.have.status(200);
            var $ = cheerio.load(res.text);
            var title = $('title').text();
            assert.equal(title, "Registration Page")
            done()
          })
  });
});

describe('GET /trading', function () {
  it("should return the trading page with the title 'You are not logged in.'", function (done) {
      request(app)
          .get('/trading')
          .set('Accept', 'application/json')
          .expect('Content-Type', "text/html; charset=utf-8")
          .expect(200)
          .end(function(err, res) {
            done();
          })
  });
});

describe('GET /trading-success', function () {
  it("should return the trading page after you have logged in", function (done) {
      request(app)
          .get('/trading-success')
          .set('Accept', 'application/json')
          .expect('Content-Type', "text/html; charset=utf-8")
          .expect(200)
          .end(function(err, res) {
            done();
          })
  });
});

describe('GET /admin', function () {
  it("should return the admin page with the title 'You are not authorized to view this page'", function (done) {
      request(app)
          .get('/admin')
          .set('Accept', 'application/json')
          .expect('Content-Type', "text/html; charset=utf-8")
          .expect(200)
          .end(function(err, res) {
            done();
          })
  });
});

describe('GET /admin-restricted', function () {
  it("should return the restricted administrator page", function (done) {
      request(app)
          .get('/admin-restricted')
          .set('Accept', 'application/json')
          .expect('Content-Type', "text/html; charset=utf-8")
          .expect(200)
          .end(function(err, res) {
            done();
          })
  });
});

describe('GET *', function () {
  it("should return the error page", function (done) {
      request(app)
          .get('*')
          .set('Accept', 'application/json')
          .expect('Content-Type', "text/html; charset=utf-8")
          .expect(200)
          .end(function(err, res) {
            done();
          })
  });
});

