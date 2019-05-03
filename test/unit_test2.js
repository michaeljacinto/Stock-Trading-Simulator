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

describe('POST /login - 200', function () {
    it("Should successfully log in", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'michaell',
            'password': 'michaell1'
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

describe('POST /login - 200', function () {
    it("Should deny login due to inputting a hashed password", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'mjacinto3',
            'password': '$2b$10$4aRFTOiKw9x4CGvjjf7PJeBMoHaf61sHQyrhb2lsd.OOuyohtNyfe'
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

describe('POST /register - 200', function () {
    it("Should give error that user already exists", function (done) {
        agent
        .post('/register')
        .send({
            '_method': 'post',
            'firstname': 'john',
            'lastname': 'albert',
            'username': 'jalbert',
            'password': 'ilovecats5',
            'confirm_password': 'ilovecats5'
        })
        .then((res) => {

          expect(res).to.have.status(200);
          var $ = cheerio.load(res.text);
          var title = $('form > p').text();
          assert.equal(title, "The username 'jalbert' already exists within the system.");
            done();
        });
    });
});

describe('POST /register - 200', function () {
    it("Should give message that account was created successfully", function (done) {
        agent
        .post('/register')
        .send({
            '_method': 'post',
            'firstname': 'john',
            'lastname': 'alberts',
            'username': 'albertsjohn3',
            'password': 'ilovedogs9',
            'confirm_password': 'ilovedogs9'
        })
        .then((res) => {
          expect(res).to.have.status(200);
          var $ = cheerio.load(res.text);
          var title = $('form > p').text();
          assert.equal(title, "You have successfully created an account with the username 'albertsjohn3' and have been granted $10,000 USD. Head over to the login page.");
            done();
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

describe('GET /trading - 200', function () {
  it("should return webpage with title of 'Trading' ", function (done) {
      request(app)
          .get('/trading')
          .set('Accept', 'application/json')
          .expect('Content-Type', "text/html; charset=utf-8")
          .end(function(err, res) {
            expect(res).to.have.status(200);
            var $ = cheerio.load(res.text);
            var title = $('title').text();
            assert.equal(title, "Trading")
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

// describe('POST /', function () {
//   it("should return the error page", function (done) {
//       request(app)
//           .post('/')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200, done)
//           .end(function(err, res) {
//             // if (err) throw err;
//             // console.log(res) 
//             // console.log('test: ' + res.text);
//             done();
//           })
//   });
// });

// describe('POST /login', function () {
//   it("should return the login pages", function (done) {
//       request(app)
//           .post('/login')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200, done)
//           .end(function(err, res) {
//             // if (err) throw err;
//             // console.log(res) 
//             // console.log('test: ' + res.text);
//             done();
//           })
//   });
// });

// describe('POST /login-fail', function () {
//   it("should return the login page", function (done) {
//       request(app)
//           .post('/login-fail')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200, done)
//           .end(function(err, res) {
//             // if (err) throw err;
//             // console.log(res) 
//             // console.log('test: ' + res.text);
//             done();
//           })
//   });
// });

// describe('POST /trading-success-buy', function () {
//   it("should return the register page", function (done) {
//       request(app)
//           .post('/trading-success-buy')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200, done)
//           .end(function(err, res) {
//             // if (err) throw err;
//             // console.log(res) 
//             // console.log('test: ' + res.text);
//             done();
//           })
//   });
// });

// describe('POST /trading-success-search', function () {
//   it("should return the register page", function (done) {
//       request(app)
//           .post('/trading-success-search')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200, done)
//           .end(function(err, res) {
//             // if (err) throw err;
//             // console.log(res) 
//             // console.log('test: ' + res.text);
//             done();
//           })
//   });
// });

// describe('POST /trading-success-buy', function () {
//   it("should return the register page", function (done) {
//       request(app)
//           .post('/trading-success-buy')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200, done)
//           .end(function(err, res) {
//             // if (err) throw err;
//             // console.log(res) 
//             // console.log('test: ' + res.text);
//             done();
//           })
//   });
// });

// describe('POST /trading-success-sell', function () {
//   it("should return the register page", function (done) {
//       request(app)
//           .post('/trading-success-sell')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200, done)
//           .end(function(err, res) {
//             // if (err) throw err;
//             // console.log(res) 
//             // console.log('test: ' + res.text);
//             done();
//           })
//   });
// });

// describe('POST /trading-success-holdings', function () {
//   it("should return the register page", function (done) {
//       request(app)
//           .post('/trading-success-holdings')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200, done)
//           .end(function(err, res) {
//             // if (err) throw err;
//             // console.log(res) 
//             // console.log('test: ' + res.text);
//             done();
//           })
//   });
// });


// describe('POST /register', function () {
//   it("should return the register page", function (done) {
//       request(app)
//           .post('/register')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200, done)
//           .end(function(err, res) {
//             // if (err) throw err;
//             // console.log(res) 
//             // console.log('test: ' + res.text);
//             done();
//           })
//   });
// });
//assert.isArray(numbers, 'is array of numbers');