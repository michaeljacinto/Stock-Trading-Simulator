const express = require('express');
const axios = require('axios');
const hbs = require('hbs');
const path = require("path");
const LocalStrategy = require('passport-local');
const passport = require('passport');
const bodyParser = require('body-parser');
var mongoose = require('mongoose');
var fs = require('fs');
var session = require('express-session');
const MongoClient = require('mongodb').MongoClient;
// const check = require('express-validator');
var utils = require('./utils');
var cookieParser = require('cookie-parser');
var ObjectID = require('mongodb').ObjectID;
var assert = require('assert');
const bcrypt = require('bcrypt');
var moment = require('moment');
var numeral = require('numeral');
var nodemailer = require('nodemailer');

hbs.registerPartials(__dirname + '/views/partials');

var port = process.env.PORT || 8080;

// global variable for login message
var login_message = '';

mongoose.Promise = global.Promise;
var mongoURL = "mongodb+srv://stockTradingSimulator:BqZpk9VBFkWegFTq@cluster0-ulvwp.mongodb.net/accounts"

// password login
mongoose.connect(mongoURL, { useNewUrlParser: true });

var app = express();

app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use('/static', express.static('static'))

hbs.registerHelper('dbConnection', function(req,res) {
	var url = mongoURL;
	return url;
})

// session used for tracking logins
app.use(session({
	secret: 'secretcode',
	resave: false,
	saveUninitialized: false
}));


passport.serializeUser(function(user, done) {
        done(null, user);
    });

passport.deserializeUser(function(user, done) {
        done(null, user);
    });

app.use((request, response, next) => {
	var time = new Date().toString();
	var log_entry = `${time.slice(4, 21)}: ${response.statusCode} - ${request.method} ${request.url}`;
	// console.log(log_entry);
	fs.appendFile('server.log', log_entry + '\n', (error) => {
		if (error) {
			console.log('Unable to log message');
		}
	});
	next();
});

// account schema used to check with MongoDB
var account_schema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		minlength: 3,
		maxlength: 60
	},
	password: {
		type: String,
		required: true,
		minlength: 3,
		maxlength: 60
	}
});

// nodemailer account details
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'recovery.stocktradingsimulator@gmail.com',
		pass: 'Group#4Teen'
	}
});

const user_account = mongoose.model("user_accounts", account_schema);

app.get('/', (request, response) => {

	response.render('login.hbs', {
		title: 'Welcome to the login page.'
	})

	request.session.destroy(function(err) {
	});
});

app.get('/login', (request, response) => {
	request.session.destroy(function(err) {
		response.render('login.hbs', {
			title: 'Welcome to the login page.'
		})
	});
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    user_account.findOne({ username: username }, function (err, user) {

      if (err) {
      	return done(err);
      }

      if (!user) {
      	login_message = 'Invalid login credentials. After 5 unsuccessful login attempts your account will be locked.';
      	return done(null, false);
      }

      // comparing hashed password to user password
      var db = utils.getDb();

      db.collection('user_accounts').findOne({username: username}, function(err, result) {

      	// checks it account is locked
      	if (result.account_status !== 'locked') {

	      bcrypt.compare(password, user.password, function(err, res) {
	      	if(res) {

	      		db.collection('user_accounts').updateOne(
					{ "username": username},
					{ $set: { "attempts": 0}}
					);

	      		return done(null, user);

	      	}
	      	else {

	      		var num_attempts;
	      		db.collection('user_accounts').findOne({username: username}, function(err, result) {

      			if (result !== null) {

      				num_attempts = result.attempts + 1;

      				db.collection('user_accounts').updateOne(
					{ "username": username},
					{ $set: { "attempts": num_attempts}}
					);

      				if (num_attempts >= 5) {
      					db.collection('user_accounts').updateOne(
						{ "username": username},
						{ $set: { "account_status": 'locked'}}
						);
      				}
      			}

	      		})
	      		login_message = 'Invalid login credentials. After 5 unsuccessful login attempts your account will be locked.';
	      		return done(null, false);
	      	}

	      });
	  	}

	  	else {
	  		login_message = 'Your account is locked. Please contact the admin at admin@bcit.ca';
	  		return done(null, false);
	  	}
    });
  });
  }
));
// if login credentials are invalid displays error message
app.get('/login-fail', (request, response) => {
	request.session.destroy(function(err) {
		response.render('login.hbs', {
			title: login_message
		})
	});
});

// logs out of session
app.get('/logout', function (request, response){
  request.session.destroy(function (err) {
    response.redirect('/');
  });
});

// log in, redirects if invalid credentials
app.post('/',
  passport.authenticate('local', { failureRedirect: '/login-fail' }),
  function(request, response) {
  	// console.log(request.body.username);
    response.redirect('/home');
  });

// log in, redirects if invalid credentials
app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login-fail' }),
  function(request, response) {
    response.redirect('/home');
 });

// log in, redirects if invalid credentials
app.post('/login-fail',
  passport.authenticate('local', { failureRedirect: '/login-fail' }),
  function(request, response) {
    response.redirect('/home');
	});
	
// password recover email, emails recover password if valid email

app.post('/recovery', (request, response) => {

	var db = utils.getDb();

	input_email = request.body.email;


	db.collection('user_accounts').find().toArray(function (err, result_list) {
				if (err) {
					response.send('Unable to fetch Accounts');
				}

				var num_users = result_list.length

				for (var i = 0; i < num_users; i++) {

				if (input_email == result_list[i].email) {

		
					password = Math.random().toString(36).slice(2)

					bcrypt.hash(password, 10, function (err, hash) {
						

						db.collection('user_accounts').updateOne({
							"email": input_email
						}, {
							$set: {
								"password": hash
							}
						});

					})

					 var mailOptions = {
					 	from: 'Stock Trading Simulator Support',
					 	to: input_email,
					 	subject: 'Password Recovery - Stock Trading Simulator',
					 	html: 'Below is the recovery info for your account: <br> Username: <strong>' + result_list[i].username + '</strong><br>Password: <strong>' + password + '</strong>'
					 };

					 transporter.sendMail(mailOptions, function (error, info) {
					 	if (error) {
					 		console.log(error);
					 	} else {
					 		console.log('Email sent: ' + info.response);
					 	}
					 });

					message = 'Your password has been changed.'


				}

					
				}

					response.redirect('/');

					request.session.destroy(function (err) {});
					});
					db.close;
				});

// allows for success of logging in via correct username and password

app.get('/home', isAuthenticated, (request, response) => {

	var acc_type = request.session.passport.user.type;
	var news_feed = [];
	var news_url = [];
	var news_imgs = [];
	var open_source_imgs = ['https://cdn.pixabay.com/photo/2016/11/23/14/37/blur-1853262_1280.jpg',
							'https://cdn.pixabay.com/photo/2016/11/27/21/42/stock-1863880_960_720.jpg',
							'https://cdn.pixabay.com/photo/2016/10/10/22/38/business-1730089_960_720.jpg',
							'https://cdn.pixabay.com/photo/2017/08/10/01/42/stock-market-2616931_960_720.jpg',
							'https://cdn.pixabay.com/photo/2015/04/25/05/17/stock-exchange-738671_1280.jpg',
							'https://cdn.pixabay.com/photo/2015/02/05/08/12/stock-624712_1280.jpg']

	const get_news = async () => {

		try {
			const news = await axios.get(`https://newsapi.org/v2/everything?language=en&domains=wsj.com,nytimes.com,yahoo.com&q=stocks&sortBy=publishedAt&apiKey=9049059c45424a3c8dd8b9891f2a5d7c`);
			news_items = news.data.articles;

			for (var i = 0; i <= 5; i++) {
				news_feed.push(news_items[i].title);
				news_url.push(news_items[i].url);

				if (news_items[i].urlToImage === null) {
					news_imgs.push(open_source_imgs[i]);
				}

				else {
					news_imgs.push(news_items[i].urlToImage);
				}

			}
		}
		catch(err) {

		}
		mongoose.connect(mongoURL, { useNewUrlParser: true }, function (err, db) {
			assert.equal(null, err);

			db.collection('user_accounts').find().toArray(function (err, result_list) {
				if (err) {
				}

				var num_users = result_list.length
				db.collection('user_accounts').find().sort({
					"cash": -1
				}).limit(20).toArray(function (err, result) {
					if (err) {
						response.send('Unable to fetch Accounts');
					}

					response.render('home.hbs', {
						title: 'Welcome to the login page.',
						result: result,
						news: news_feed,
						urls: news_url,
						imgs: news_imgs,
						num_users: num_users,
						query: '',
						admin: if_admin(acc_type)
					});

				});
				db.close;
			})
		});

		//allows leaderboard to show proper rank numbers
		hbs.registerHelper('incremented', function (index) {
			index++;
			return index;
		});

	}

	get_news();

});

function if_admin (string_input) {
	// checks if string value is between 3 and 12 characters, uses RegEx to confirm only alphabetical characters
	if (string_input === 'admin') {
		return true;
	}
	else {
		return false;
	}
}

app.post('/home', isAuthenticated, (request, response) => {

	var acc_type = request.session.passport.user.type;
	var query = request.body.news_search;
	var news_feed = [];
	var news_url = [];
	var news_imgs = [];
	var open_source_imgs = ['https://cdn.pixabay.com/photo/2016/11/23/14/37/blur-1853262_1280.jpg',
							'https://cdn.pixabay.com/photo/2016/11/27/21/42/stock-1863880_960_720.jpg',
							'https://cdn.pixabay.com/photo/2016/10/10/22/38/business-1730089_960_720.jpg',
							'https://cdn.pixabay.com/photo/2017/08/10/01/42/stock-market-2616931_960_720.jpg',
							'https://cdn.pixabay.com/photo/2015/04/25/05/17/stock-exchange-738671_1280.jpg',
							'https://cdn.pixabay.com/photo/2015/02/05/08/12/stock-624712_1280.jpg']

	const get_news = async () => {

		try {
			const news = await axios.get(`https://newsapi.org/v2/everything?language=en&domains=wsj.com,nytimes.com,yahoo.com&q=${query}&sortBy=publishedAt&apiKey=9049059c45424a3c8dd8b9891f2a5d7c`);
			news_items = news.data.articles;

			for (var i = 0; i <= 5; i++) {
				news_feed.push(news_items[i].title);
				news_url.push(news_items[i].url);

				if (news_items[i].urlToImage === null) {
					news_imgs.push(open_source_imgs[i]);
				}
				else {
					news_imgs.push(news_items[i].urlToImage);
				}

			}
		}
		catch(err) {

		}
		mongoose.connect(mongoURL, { useNewUrlParser: true }, function (err, db) {
			assert.equal(null, err);

			db.collection('user_accounts').find().toArray(function (err, result_list) {
				if (err) {
				}

				var num_users = result_list.length
				db.collection('user_accounts').find().sort({
					"cash": -1
				}).limit(20).toArray(function (err, result) {
					if (err) {
						response.send('Unable to fetch Accounts');
					}

					response.render('home.hbs', {
						title: 'Welcome to the login page.',
						result: result,
						news: news_feed,
						urls: news_url,
						imgs: news_imgs,
						num_users: num_users,
						query: query,
						admin: if_admin(acc_type)
					});

				});
				db.close;
			})
		});

		//allows leaderboard to show proper rank numbers
		hbs.registerHelper('incremented', function (index) {
			index++;
			return index;
		});

	}

	if (query !==  '') {
		get_news();
	}
	else {
		response.redirect('/home');
	}

});

app.get('/search/:stockTicker/', isAuthenticated, (request, response) => {

	var acc_type = request.session.passport.user.type;
	var stock_ticker = request.params.stockTicker
	stock = stock_ticker

	var historical_prices = [];
	var dates = [];
	var stock_name;
	var check = false;
	const get_stock_info = async (stock_ticker) => {

		var message;

		try {
			const stock_info = await axios.get(`https://cloud.iexapis.com/beta/stock/${stock_ticker}/quote?token=sk_291eaf03571b4f0489b0198ac1af487d`);
			const stock_historical_info = await axios.get(`https://api.iextrading.com/1.0/stock/${stock_ticker}/chart/1y`);

			stock_name = stock_info.data.companyName;
			var stock_price = stock_info.data.latestPrice;
			var historical_data = stock_historical_info.data;

			for (var num = historical_data.length - 1; num >= 33; num -= 5) {
				hist_date = historical_data[num].date
				day = hist_date.slice(6, 10)
				dates.push(day);
				historical_prices.push(historical_data[num].close);
			}

			message = `The price of the selected ticker '${stock.toUpperCase()}' which belongs to '${stock_name}' is currently: $${stock_price} USD.`;
			check = true;
		}
		catch (err) {
			if (stock === '') {
				message = 'Please enter a stock ticker i.e. TSLA, MSFT';
			}
			else {
				message = `Sorry the stock ticker '${stock}' is invalid.`;
			}
		}

		response.render('graph.hbs', {
			title: message,
			dates: dates,
			prices: historical_prices,
			stock_name: stock_name,
			check: check,
			admin: if_admin(acc_type)
		})
	}

	get_stock_info(stock);

});

app.get('/profile', isAuthenticated, (request, response) => {

	var acc_type = request.session.passport.user.type;
	var firstname = request.session.passport.user.firstname;
	var lastname = request.session.passport.user.lastname;
	var username = request.session.passport.user.username;
	var email = request.session.passport.user.email;

	response.render('profile.hbs', {
		title: '',
		password_msg: '',
		fname: firstname,
		lname: lastname,
		uname: username,
		email: email,
		admin: if_admin(acc_type)
	})
});

app.post('/profile-info-change', isAuthenticated, (request, response) => {

	var db = utils.getDb();
	var _id = request.session.passport.user._id;
	var firstname = request.body.firstname;
	var user_firstname = request.session.passport.user.firstname;
	var lastname = request.body.lastname;
	var user_lastname = request.session.passport.user.lastname;
	var username = request.body.username;
	var user_username = request.session.passport.user.username;
	var email = request.body.email;
	var user_email = request.session.passport.user.email;
	var acc_type = request.session.passport.user.type;
	var message;
	var check;


	if (check_str(firstname) === false) {
		message = `First name must have alteast 3 letters.`;
	}
	else if (check_str(lastname) === false) {
		message = `Last name must have alteast 3 letters.`;
	}
	else if (check_alphanum(username) === false) {
		message = `Username must have 5-15 characters and may only be alphanumeric.`;
	}
	else if (check_email(email) === false) {
		message = `Must enter a valid email.`;
	}
	else {
		check = true;
	}

	if (check) {

		if ((firstname === user_firstname) && (lastname === user_lastname) && (user_username === username) && (email === user_email)) {
			message = 'To make changes please update your information.';
				response.render('profile.hbs', {
				title: message,
				password_msg: '',
				fname: firstname,
				lname: lastname,
				uname: username,
				email: email,
				admin: if_admin(acc_type)
			})
		}

		else {

			db.collection('user_accounts').findOne({username: username}, function(err, result) {

				if ((result === null) || ((result.username === user_username) && (result.email === user_email)) || (result.email === user_email) ||  (result.username === user_username)) {
					
					db.collection('user_accounts').findOne({email: email}, function(err, result1) {

						if ((result1 === null) || ((result1.username === user_username) && (result1.email === user_email)) || (result1.email === user_email) ||  (result1.email === user_email)) {
							db.collection('user_accounts').updateOne(
								{ "_id": ObjectID(_id)},
								{ $set: { "firstname": firstname, "lastname": lastname,
								"username": username, "email": email}}
							);

							message = 'Your information has been updated. Please log back in to view the new changes.';

							response.render('profile.hbs', {
								title: message,
								password_msg: '',
								fname: firstname,
								lname: lastname,
								uname: username,
								email: email,
								admin: if_admin(acc_type)
							})
						}
						else {
							message = `The email ${email} is already in the system. Please choose a different email.`;
							response.render('profile.hbs', {
								title: message,
								password_msg: '',
								fname: firstname,
								lname: lastname,
								uname: username,
								email: email,
								admin: if_admin(acc_type)
							})
						}
					});
				}

				else {
					message = `The username ${username} is already in the system. Please choose a different username.`;
					response.render('profile.hbs', {
						title: message,
						password_msg: '',
						fname: firstname,
						lname: lastname,
						uname: username,
						email: email,
						admin: if_admin(acc_type)
					})
				}

			
			});
		}

	}

	else {
		response.render('profile.hbs', {
			title: message,
			password_msg: '',
			fname: firstname,
			lname: lastname,
			uname: username,
			email: email,
			admin: if_admin(acc_type)
		})
	}

});

app.post('/profile-password-change', isAuthenticated, (request, response) => {

	var acc_type = request.session.passport.user.type;
	var db = utils.getDb();
	var _id = request.session.passport.user._id;
	var database_password = request.session.passport.user.password;
	var current_password = request.body.current_password;
	var password = request.body.password;
	var confirm_password = request.body.confirm_password;
	var firstname = request.session.passport.user.firstname;
	var lastname = request.session.passport.user.lastname;
	var username = request.session.passport.user.username;
	var email = request.session.passport.user.email;
	var message = '';

		// compares current password to hashed password
		bcrypt.compare(current_password, database_password, function(err, res) {

			console.log(res);
			console.log(current_password);
			console.log(database_password);

			if(res === false) {
				message = 'Your password is incorrect.';
			}

			else if (res === true) {

				if (password === '') {
					message = `To change password, please enter your current password.`;
				}

				else if (check_password(password) === false) {
					message = `The new password must be atleast 8 characters with atleast 1 letter & 1 number.`;
				}

				else if (password !== confirm_password) {
					message = 'Passwords do not match.';
				}

				else {

					bcrypt.hash(password, 10, function(err, hash) {

						db.collection('user_accounts').updateOne(
							{ "_id": ObjectID(_id)},
							{ $set: { "password": hash}}
						);

					})

					message = 'Your password has been changed.'
				}
			}

			response.render('profile.hbs', {
				title: '',
				password_msg: message,
				fname: firstname,
				lname: lastname,
				uname: username,
				email: email,
				admin: if_admin(acc_type)
			});
			
		});
});

app.get('/transactions', isAuthenticated, (request, response) => {

	var transactions = request.session.passport.user.transactions;
	var acc_type = request.session.passport.user.type;

	response.render('transactions.hbs', {
		// title: 'Welcome to the trading page.'
		transactions: transactions,
		admin: if_admin(acc_type)
	});

});

app.get('/register', (request, response) => {
	response.render('registration.hbs', {
		title: 'To create an account please enter credentials.'
	})
});

app.get('/registration-logged-in', isAuthenticated, (request, response) => {
	response.render('registration-logged-in.hbs', {
		title: 'You are already logged in. Logout to make a new account.'
	})
});

app.post('/register', function(request, response) {

	response.status(200);
	var firstname = request.body.firstname;
	var lastname = request.body.lastname;
	var username = request.body.username;
	var password = request.body.password;
	var email = request.body.email;
	var message;
	var confirm_password = request.body.confirm_password;
	var db = utils.getDb();
	var attributes = [firstname, lastname, username, email, password, confirm_password];
	var check;


	// argument validations
	if (check_str(attributes[0]) === false) {
		message = `First name must have alteast 3 letters.`;
	}
	else if (check_str(attributes[1]) === false) {
		message = `Last name must have alteast 3 letters.`;
	}
	else if (check_alphanum(attributes[2]) === false) {
		message = `Username must have 5-15 characters and may only be alphanumeric.`;
	}
	else if (check_email(attributes[3]) === false) {
		message = `Must enter a valid email`;
	}
	else if (check_password(attributes[4]) === false) {
		message = `Password must be a minimum 8 characters with atleast 1 letter & 1 number.`;
	}
	else if ((attributes[4]) !== attributes[5]) {
		message = `Passwords do not match. Please try again.`;
	}
	else {
		check = true;
	}

	// add to the database 
	if (check) {
		
		db.collection('user_accounts').findOne({username: username}, function(err, result) {

			if (result === null) {

				db.collection('user_accounts').findOne({email: email}, function(err, result1) {


					if (result1 === null) {
						bcrypt.hash(password, 10, function(err, hash) {

							db.collection('user_accounts').insertOne({
								firstname: firstname,
								lastname: lastname,
								username: username,
								email: email,
								password: hash,
								type: 'standard',
								cash: [10000],
								stocks: [],
								attempts: 0,
								account_status: 'unlocked',
								transactions: []


							}, (err, result) => {

								message = `You have successfully created an account with the username '${username}' and have been granted $10,000 USD. Head over to the login page.`;
								response.render('registration.hbs', {
									title: message,
									firstname: firstname,
									lastname: lastname,
									username: username,
									email: email
								});
							});
						});
					}	
					else {
						message = `The email '${email}' already exists within the system.`;
						response.render('registration.hbs', {
							title: message,
							firstname: firstname,
							lastname: lastname,
							username: username,
							email: email
						});
					}
				});
			}
			else {
				message = `The username '${username}' already exists within the system.`;
				response.render('registration.hbs', {
					title: message,
					firstname: firstname,
					lastname: lastname,
					username: username,
					email: email
				});
			}

		}

	)}

	else {
		response.render('registration.hbs', {
			title: message,
			firstname: firstname,
			lastname: lastname,
			username: username,
			email: email
		});
	}

});

function check_str (string_input) {
	// checks if string value is between 3 and 12 characters, uses RegEx to confirm only alphabetical characters
	var valid_chars = /^[a-zA-Z ]{3,30}$/;
	var string_length = string_input.length;

	if (valid_chars.test(string_input)) {
		flag = true;
	}
	else {
		flag = false;
	}
	return flag;
}

function check_alphanum (string_input) {
	// checks if string value is between 5 and 15 characters, uses RegEx to confirm only alphanumerical chars
	var valid_chars = /^([a-zA-Z0-9_-]){5,15}$/;

	if (valid_chars.test(string_input)) {
		flag = true;
	}
	else {
		flag = false;
	}
	return flag;
}

function check_password(string_input) {
	// checks if password is atleast 8 characters long containing 1 letter and 1 number
	var valid_chars = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

	if (valid_chars.test(string_input)) {
		flag = true;
	} else {
		flag = false;
	}
	return flag;
}

function check_email(string_input) {
	// checks if password is atleast 8 characters long containing 1 letter and 1 number
	var valid_chars = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	if (valid_chars.test(string_input)) {
		flag = true;
	} else {
		flag = false;
	}
	return flag;
}

module.exports = {
	check_str: check_str,
	check_alphanum: check_alphanum
}

app.get('/trading', (request, response) => {
	response.render('trading.hbs', {
		title: 'You are not logged in. You must be logged in to view this page.'
	})
});

app.get('/trading-success', isAuthenticated, (request, response) => {

	var acc_type = request.session.passport.user.type;

	response.render('trading-success.hbs', {
		title: 'Welcome to the trading page.',
		admin: if_admin(acc_type)
	});
});

app.post('/trading-success-search', isAuthenticated, (request, response) => {

	var acc_type = request.session.passport.user.type;
	var stock = request.body.stocksearch;
	var cash = request.session.passport.user.cash;
	var historical_prices = [];
	var dates = [];
	var stock_name;
	var check = false;
	const get_stock_info = async (stock_ticker) => {

		var message;

		try {
			const stock_info = await axios.get(`https://cloud.iexapis.com/beta/stock/${stock_ticker}/quote?token=sk_291eaf03571b4f0489b0198ac1af487d`);
			const stock_historical_info = await axios.get(`https://api.iextrading.com/1.0/stock/${stock_ticker}/chart/1y`);

			stock_name = stock_info.data.companyName;
			var stock_price = stock_info.data.latestPrice;
			var historical_data = stock_historical_info.data;

			for (var num = historical_data.length - 1; num >= 33; num -= 5) {
				hist_date = historical_data[num].date
				day = hist_date.slice(6,10)
				dates.push(day);
				historical_prices.push(historical_data[num].close);
			}

			message = `The price of the selected ticker '${stock.toUpperCase()}' which belongs to '${stock_name}' is currently: $${stock_price} USD.`;
			check = true;
		}
		catch (err) {
			if (stock === '') {
				message = 'Please enter a stock ticker i.e. TSLA, MSFT';
			}
			else {
				message = `Sorry the stock ticker '${stock}' is invalid.`;
			}
		}

		response.render('trading-success.hbs', {
				title: message,
				dates: dates,
				prices: historical_prices,
				stock_name: stock_name,
				head: `Cash balance: $${cash[0]}`,
				check: check,
				admin: if_admin(acc_type)
				})
	}

	get_stock_info(stock);
});

app.post('/trading-success-buy', isAuthenticated, (request, response) => {

	var acc_type = request.session.passport.user.type;
	var _id = request.session.passport.user._id;
	var qty = request.body.buystockqty;
	var stock = (request.body.buystockticker).toUpperCase();
	var stocks = request.session.passport.user.stocks;
	var cash = request.session.passport.user.cash;
	var transactions = request.session.passport.user.transactions;

	const buy_stock = async () => {

		var index = check_existence(stock);

		try {
			const stock_info = await axios.get(`https://cloud.iexapis.com/beta/stock/${stock}/quote?token=sk_291eaf03571b4f0489b0198ac1af487d`);
			var stock_name = stock_info.data.companyName;
			var stock_price = stock_info.data.latestPrice;
			var total_cost = Math.round(stock_price*qty*100)/100;
			var cash_remaining = Math.round((cash - total_cost)*100)/100;
			var stock_holding = {[stock]:parseInt(qty)};
			var company_name = stock_info.data.companyName;

			if ((cash_remaining >= 0) && (total_cost !== 0) && (qty > 0)) {

				var db = utils.getDb();

				if (index >= 0) {
					var stock_qty = request.session.passport.user.stocks[index][stock];
					var stock_remaining = parseInt(qty) + parseInt(stock_qty);
					stock_holding = {[stock]:parseInt(stock_remaining)};
					stocks[index] = stock_holding;
					cash[0] = cash_remaining;
				}
				else {
					cash[0] = cash_remaining;

					console.log("cash_remaining after else, after cash=cash_remain:"+cash_remaining);


					stocks.push(stock_holding);
				}

				var transaction = transaction_log("BUY", stock, company_name, qty, stock_price, total_cost, cash_remaining);

				transactions.unshift(transaction);

				db.collection('user_accounts').updateOne(
					{ "_id": ObjectID(_id)},
					{ $set: { "cash": cash, "stocks": stocks, "transactions": transactions}}
				);

				message = `You successfully purchased ${qty} shares of ${stock_name} (${stock}) at $${stock_price}/share for $${total_cost}.`;

			}
			else if (total_cost === 0) {
				message = `Sorry you need to purchase at least 1 stock. Change your quantity to 1 or more.`;
			}
			else if (qty < 0) {
				message = `You cannot buy negative shares.`;
			}
			else {
				message = `Sorry you only have $${cash[0]}. The purchase did not  go through. The total cost was $${total_cost}.`;
			}

		}
		catch (err) {
			if (stock === '') {
				message = `Sorry, you must input a stock to buy.`;
			}
			else {
				message = `Sorry the stock ticker '${request.body.buystockticker}' is invalid.`;
			}
		}

		response.render('trading-success.hbs', {
						title: message,
						head: `Cash balance: $${cash[0]}`,
						admin: if_admin(acc_type)
					})

		function check_existence(stock) {
			var index = -1;

			for (i = 0; i < stocks.length; i++) {
				if (stocks[i][stock] !== undefined) {
					index = i;
				}
			}

			return index;
		}
	}
	buy_stock();
});

function transaction_log(action, ticker, company, qty, cost_share, total, balance) {

	var date = moment().format('MMMM Do YYYY, h:mm:ss a');

	// var total = parseFloat(numeral(total).format('(0,0.00)'));

	if (action === "BUY") {
		total = total * -1;
	}

	var transaction = { date: date,
						action_type: action,
						symbol: ticker,
						company: company,
						qty: qty,
						cost_per_share: cost_share,
						total: total,
						balance_after_transaction: balance
					}

	return transaction;
}

app.post('/trading-success-sell', isAuthenticated, (request, response) => {

	var acc_type = request.session.passport.user.type;
	var _id = request.session.passport.user._id;
	var cash = request.session.passport.user.cash;
	var qty = parseInt(request.body.sellstockqty);
	var stock = (request.body.sellstockticker).toUpperCase();
	var stocks = request.session.passport.user.stocks;
	var transactions = request.session.passport.user.transactions;

	const sell_stock = async () => {


		var index = check_existence(stock);
		var message;

		try {
			const stock_info = await axios.get(`https://cloud.iexapis.com/beta/stock/${stock}/quote?token=sk_291eaf03571b4f0489b0198ac1af487d`);

			var stock_name = stock_info.data.companyName;
			var stock_price = stock_info.data.latestPrice;
			var total_sale = Math.round(stock_price*qty*100)/100;
			var remaining_balance = Math.round((cash[0] + total_sale)*100)/100;
			var stock_qty = request.session.passport.user.stocks[index][stock];
			var company_name = stock_info.data.companyName;
			var stock_remaining = stock_qty - qty;

			if (stock_qty < qty) {
				message = `You are trying to sell ${qty} shares of ${stock} when you only have ${stock_qty} shares.`;
			}
			else if ((stock_qty >= qty) && (total_sale > 0)) {
				var db = utils.getDb();
				console.log(stocks);

				if (stock_remaining > 0) {
					var stock_holding = {[stock]:parseInt(stock_remaining)};
					stocks[index] = stock_holding;
					cash[0] = remaining_balance;
				}
				else {
					stocks.splice(index, 1);
					cash[0] = remaining_balance;
				}

				var transaction = transaction_log("SELL", stock, company_name, qty, stock_price, total_sale, remaining_balance);

				transactions.unshift(transaction);

				db.collection('user_accounts').updateOne(
					{ "_id": ObjectID(_id)},
					{ $set: { "cash": cash, "stocks": stocks, "transactions": transactions}}
				);

				message = `You successfully sold ${qty} shares of ${stock_name} (${stock}) at $${stock_price}/share for $${total_sale}.`
			}
			else {
				message = `You need to sell atleast 1 share of ${stock}.`;
			}

		}
		catch(err) {
			if (stock === '') {
				message = `You cannot leave the sell input blank. Please input a stock ticker`;

			}
			else {
				message = `You do not own any shares with the ticker '${stock}'.`;
			}
		}
		response.render('trading-success.hbs', {
			title: message,
			head: `Cash balance: $${cash[0]}`,
			admin: if_admin(acc_type)
		})

		function check_existence(stock) {
			var index = -1;

			for (i = 0; i < stocks.length; i++) {
				if (stocks[i][stock] !== undefined) {
					index = i;
				}
			}
			return index;
		}
	}
	sell_stock();
});

app.post('/trading-success-holdings', isAuthenticated, (request, response) => {

	var acc_type = request.session.passport.user.type;
	var stocks = request.session.passport.user.stocks;
	var num_stocks = stocks.length;
	var stock_keys = [];
	var message = 'Shares: \n';
	var cash = request.session.passport.user.cash;

	if (num_stocks === 0) {
		message = 'You currently do not have any stocks.';
	}
	else {
		var i;
		for (i = 0; i < num_stocks; i++) {
			stock_keys.push(Object.keys(stocks[i]));
			var key_value = stocks[i][stock_keys[i][0]];
			message += stock_keys[i][0] + ': ' + key_value + ' shares.' + '\n';
			console.log(message);
		}
	}

	response.render('trading-success.hbs', {
		title: message,
		head: `Cash: $${cash[0]}`,
		admin: if_admin(acc_type)
	})
});

app.get('/admin', (request, response) => {
	response.render('admin-restricted-not-logged-in.hbs', {
		title: 'You are not authorized to view this page. Please log in with an administrator account.'
	})
});

app.get('/admin-restricted', isAuthenticated, (request, response) => {
	response.render('admin-restricted.hbs', {
		title: 'You are not authorized to view this page. Go back to the Trading page.'
	})
});

app.get('/admin-success', isAdmin, (request, response) => {

	var acc_type = request.session.passport.user.type;

    response.render('admin-success', {
    	title: 'Welcome to the Admin Page',
    	admin: if_admin(acc_type)
    });
 });

app.post('/admin-success-user-accounts', isAdmin, function(req, res, next) {

	var acc_type = req.session.passport.user.type;

	mongoose.connect(mongoURL, { useNewUrlParser: true }, function(err, db) {
		assert.equal(null, err);
		db.collection('user_accounts').find().toArray(function(err, result) {
			if (err) {
				res.send('Unable to fetch Accounts');
			}
			res.render('admin-success-user-accounts-list.hbs', {
				result: result,
				admin: if_admin(acc_type)
			});
		});
		db.close;
	});
});

app.post('/admin-success-delete-user', isAdmin, function(req, res, next) {

	var acc_type = req.session.passport.user.type;

	mongoose.connect(mongoURL, { useNewUrlParser: true }, function(err, db) {
		assert.equal(null, err);
		db.collection('user_accounts').find().toArray(function(err, result) {
			if(err) {
				res.send('Unable to fetch Accounts');
			}
			res.render('admin-success-delete-user-success.hbs', {
				result: result,
				admin: if_admin(acc_type)
			});
		});
		db.close;
	})});

app.post('/admin-success-delete-user-success', function(req, res, next) {

	var acc_type = req.session.passport.user.type;
	var user_name_to_delete = req.body.user_id;
	var username = req.session.passport.user.username;

	if(user_name_to_delete == username){
		res.render('admin-success-delete-user-success.hbs', {
			message: "Cannot delete your own account!"
		});
		return;
	}else{
		if(user_name_to_delete == '') {
			res.render('admin-success-delete-user-success.hbs', {
				message: "Cannot be empty"
			});
		}else{
				message = '';
				mongoose.connect(mongoURL, { useNewUrlParser: true }, function(err, db) {
					assert.equal(null, err);

					var query = { username: user_name_to_delete }

					db.collection('user_accounts').find(query).toArray(function(err, result) {
						if(err) {
							message = 'Unable to Delete Account';
							console.log(message)
							// console.log(err);
							res.render('admin-success-delete-user-success.hbs', {
								message: message,
								admin: if_admin(acc_type)
							});
						};

						if(result === undefined || result.length == 0) {
							message = 'No user exists with that username';
							console.log(message)
							res.render('admin-success-delete-user-success.hbs', {
								message: message,
								admin: if_admin(acc_type)
							});
						}else {
							db.collection('user_accounts').deleteOne(query, function(err, obj) {
								if(err) throw err;
								console.log("User Deleted");
								message ='User is Deleted';
								res.render('admin-success-delete-user-success.hbs', {
								message: message,
								admin: if_admin(acc_type)
							});
								db.close();
							});
						};
					});
				});

			};
		};
});

// redirects user to error page if no user is logged in and trying to access a different page
app.get('*', errorPage, (request, response) => {

	var acc_type = request.session.passport.user.type;

	response.render('404.hbs', {
		title: `Sorry the URL does not exist.`,
		admin: if_admin(acc_type)
	})
});

function errorPage(request, response, next) {
	if (request.session.passport !== undefined) {
		next();
	} else {
		response.render('404x.hbs', {
			title: `Sorry the URL does not exist.`
		})
	}
}

function isAuthenticated(request, response, next) {
	if (request.session.passport !== undefined) {
		next();
	} else {
		response.redirect('/');
	}
}

function isAdmin(request, response, next) {
	if ((request.session.passport !== undefined) && (request.session.passport.user.type === 'admin')) {
		next();
	} else {
		response.redirect('/admin-restricted');
	}
}

// listen to a port
app.listen(port, () => {
	// console.log('Server is up on port ' + port);
	utils.init();
});

module.exports = app;