const assert = require('chai').assert;
const request = require("supertest");
const expect = require('chai').expect;
var should = require('chai').should();
var cheerio = require('cheerio');
var chai = require('chai'), chaiHttp = require('chai-http');
const app = require('../project');
chai.use(chaiHttp);
var agent = chai.request.agent(app)

// describe('POST /login - 200', function () {
//     it("Should deny login due to locked account", function (done) {
//         agent
//         .post('/login')
//         .send({
//             '_method': 'post',
//             'username': 'mjacinto',
//             'password': 'mjacinto1'
//         })
//         .then(function (res) {
//         return agent.get('/trading-success')
//             .then(function (res) {
//                 var $ = cheerio.load(res.text);
//                 var display = $('title').text();
//                 assert.equal(display, "Login");
//                 expect(res).to.have.status(200);
//                 done();
//             });
//         });
//     });
// });

describe('GET /home - 200', function () {
    it("Should grant access to Home page", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'michaell',
            'password': 'michaell1'
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
            'username': 'michaell',
            'password': 'michaell1'
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

    it("Should return true valid images are returned", function (done) {
        agent
        .post('/login')
        .send({
            '_method': 'post',
            'username': 'michaell',
            'password': 'michaell1'
        })
        .then(function (res) {
        return agent.get('/home')
            .then(function (res) {
                var $ = cheerio.load(res.text);

                // checks if links are valid
                // for (var i = 1; i <= 5; i++) {
                var display = $('img[id=img5]').attr('src');
                // var regex = /\b(https?:\/\/.*?\.[a-z]{2,4}\/[^\s]*\b)/g;
                assert.equal(display.getContentType(), 'test');
                // }

                expect(res).to.have.status(200);
                done();
            });
        });
    });
    // it("Should return true if a valid link is returned", function (done) {
    //     agent
    //     .post('/login')
    //     .send({
    //         '_method': 'post',
    //         'username': 'michaell',
    //         'password': 'michaell1'
    //     })
    //     .then(function (res) {
    //     return agent.get('/home')
    //         .then(function (res) {
    //             var $ = cheerio.load(res.text);
    //             var display = $('h1[id=header1]').text();

    //             // check if % is greater than 0 and below 100
    //             assert.match(display, regex);
    //             assert.isAbove(percent, 0, 'must be above 0');
    //             assert.isBelow(percent, 100, 'must be below 100');
                
    //             expect(res).to.have.status(200);

    //             done();
    //         });
    //     });
    // });



});

// describe('GET /home - 200', function () {
//     it("Should grant access to Home page", function (done) {
//         agent
//         .post('/login')
//         .send({
//             '_method': 'post',
//             'username': 'michaell',
//             'password': 'michaell1'
//         })
//         .then(function (res) {
//         return agent.get('/home')
//             .then(function (res) {
//                 var $ = cheerio.load(res.text);
//                 var display = $('h2 > p').text();
//                 assert.equal(display, "Welcome to the Home Page.");
//                 expect(res).to.have.status(200);
//                 done();
//             });
//         });
//     });
// });

// describe('POST /login - 200', function () {
//     it("Should successfully log in", function (done) {
//         agent
//         .post('/login')
//         .send({
//             '_method': 'post',
//             'username': 'michaell',
//             'password': 'michaell1'
//         })
//         .then(function (res) {
//         return agent.get('/trading-success')
//             .then(function (res) {
//                 var $ = cheerio.load(res.text);
//                 var display = $('title').text();
//                 assert.equal(display, "Trading Page");
//                 expect(res).to.have.status(200);
//                 done()
//             });
//         });
//     });
// });

// describe('POST /login - 200', function () {
//     it("Should deny login due to inputting a hashed password", function (done) {
//         agent
//         .post('/login')
//         .send({
//             '_method': 'post',
//             'username': 'mjacinto3',
//             'password': '$2b$10$4aRFTOiKw9x4CGvjjf7PJeBMoHaf61sHQyrhb2lsd.OOuyohtNyfe'
//         })
//         .then(function (res) {
//         return agent.get('/trading-success')
//             .then(function (res) {
//                 var $ = cheerio.load(res.text);

//                 var display = $('title').text();

//                 assert.equal(display, "Login");
//                 expect(res).to.have.status(200);
//                 done();
//             });
//         });
//     });
// });

// describe('POST /register - 200', function () {
//     it("Should give error that user already exists", function (done) {
//         agent
//         .post('/register')
//         .send({
//             '_method': 'post',
//             'firstname': 'john',
//             'lastname': 'albert',
//             'username': 'jalbert',
//             'password': 'ilovecats5',
//             'confirm_password': 'ilovecats5'
//         })
//         .then((res) => {

//           expect(res).to.have.status(200);
//           var $ = cheerio.load(res.text);
//           var title = $('form > p').text();
//           assert.equal(title, "The username 'jalbert' already exists within the system.");
//             done();
//         });
//     });
// });

// describe('POST /register - 200', function () {
//     it("Should give message that account was created successfully", function (done) {
//         agent
//         .post('/register')
//         .send({
//             '_method': 'post',
//             'firstname': 'john',
//             'lastname': 'alberts',
//             'username': 'albertsjohn3',
//             'password': 'ilovedogs9',
//             'confirm_password': 'ilovedogs9'
//         })
//         .then((res) => {
//           expect(res).to.have.status(200);
//           var $ = cheerio.load(res.text);
//           var title = $('form > p').text();
//           assert.equal(title, "You have successfully created an account with the username 'albertsjohn3' and have been granted $10,000 USD. Head over to the login page.");
//             done();
//         });
//     });
// });

// describe('GET /register - 200', function () {
//   it("should return webpage with title of 'Registration Page' ", function (done) {
//       request(app)
//           .get('/register')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .end(function(err, res) {
//             expect(res).to.have.status(200);
//             var $ = cheerio.load(res.text);
//             var title = $('title').text();
//             assert.equal(title, "Registration Page")
//             done()
//           })
//   });
// });

// describe('GET /trading - 200', function () {
//   it("should return webpage with title of 'Trading' ", function (done) {
//       request(app)
//           .get('/trading')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .end(function(err, res) {
//             expect(res).to.have.status(200);
//             var $ = cheerio.load(res.text);
//             var title = $('title').text();
//             assert.equal(title, "Trading")
//             done()
//           })
//   });
// });

// describe('GET /trading', function () {
//   it("should return the trading page with the title 'You are not logged in.'", function (done) {
//       request(app)
//           .get('/trading')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200)
//           .end(function(err, res) {
//             done();
//           })
//   });
// });

// describe('GET /trading-success', function () {
//   it("should return the trading page after you have logged in", function (done) {
//       request(app)
//           .get('/trading-success')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200)
//           .end(function(err, res) {
//             done();
//           })
//   });
// });

// describe('GET /admin', function () {
//   it("should return the admin page with the title 'You are not authorized to view this page'", function (done) {
//       request(app)
//           .get('/admin')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200)
//           .end(function(err, res) {
//             done();
//           })
//   });
// });

// describe('GET /admin-restricted', function () {
//   it("should return the restricted administrator page", function (done) {
//       request(app)
//           .get('/admin-restricted')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200)
//           .end(function(err, res) {
//             done();
//           })
//   });
// });

// describe('GET *', function () {
//   it("should return the error page", function (done) {
//       request(app)
//           .get('*')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', "text/html; charset=utf-8")
//           .expect(200)
//           .end(function(err, res) {
//             done();
//           })
//   });
// });