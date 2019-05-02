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

hbs.registerPartials(__dirname + '/views/partials');
module.exports = app;

mongoose.Promise = global.Promise;

// password login
mongoose.connect("mongodb://localhost:27017/accounts", { useNewUrlParser: true });

var app = express();

app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

hbs.registerHelper('dbConnection', function(req,res) {
	var url = "mongodb://localhost:27017/accounts";
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
	var log_entry = `${time}: ${request.method} ${request.url}`;
	console.log(log_entry);
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


const user_account = mongoose.model("user_accounts", account_schema);

app.get('/', (request, response) => {
	request.session.destroy(function(err) {
		response.render('login.hbs', {
			title: 'Welcome to the login page.'
		})
	});
});

app.get('/login', (request, response) => {
	request.session.destroy(function(err) {
		response.render('login.hbs', {
			title: 'Welcome to the login page.'
		})
	});
});

// if login credentials are invalid displays error message
app.get('/login-fail', (request, response) => {
	request.session.destroy(function(err) {
		response.render('login.hbs', {
			title: 'You have entered an invalid username or password. Please try again or create a new account.'
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
    response.redirect('/trading-success');
  });

// log in, redirects if invalid credentials
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login-fail' }),
  function(request, response) {
    response.redirect('/trading-success');
  });

// log in, redirects if invalid credentials
app.post('/login-fail', 
  passport.authenticate('local', { failureRedirect: '/login-fail' }),
  function(request, response) {
    response.redirect('/trading-success');
  });

// allows for success of logging in via correct username and password
passport.use(new LocalStrategy(
  function(username, password, done) {
    user_account.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }

      // comparing hashed password to user password
      bcrypt.compare(password, user.password, function(err, res) {
      	if(res) { return done(null, user); }
      	else { return done(null, false); }
      })
    });
  }
));

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

	var firstname = request.body.firstname;
	var lastname = request.body.lastname;
	var username = request.body.username;
	var password = request.body.password;
	var message;
	var confirm_password = request.body.confirm_password;
	var db = utils.getDb();
	var attributes = [firstname, lastname, username, password, confirm_password];
	var check;

	if (check_str(attributes[0]) === false) {
		message = `First name must be 3-30 characters long and must only contain letters.`;
		response.render('registration.hbs', {title: message});
	}
	else if (check_str(attributes[1]) === false) {
		message = `Last name must be 3-30 characters long and must only contain letters.`;
		response.render('registration.hbs', {title: message});
	}
	else if (check_alphanum(attributes[2]) === false) {
		message = `Username must have 5-15 characters and may only be alphanumeric.`;
		response.render('registration.hbs', {title: message});
	}
	else if (check_alphanum(attributes[3]) === false) {
		message = `Password must have 5-15 characters and may only be alphanumeric.`;
		response.render('registration.hbs', {title: message});
	}
	else if ((attributes[3]) !== attributes[4]) {
		message = `Passwords do not match. Please try again.`;
		response.render('registration.hbs', {title: message});
	}
	else {
		check = true;
	}

	if (check) {
		db.collection('user_accounts').findOne({username: username}, function(err, result) {

			if (result === null) {

				bcrypt.hash(password, 10, function(err, hash) {

					db.collection('user_accounts').insertOne({
						firstname: firstname,
						lastname: lastname,
						username: username,
						password: hash,
						type: 'standard',
						cash: [10000],
						stocks: []

					}, (err, result) => {
						if (err) {
							messsage = `There was an error in creating your account. Please try again.`;
							response.render('registration.hbs', {title: `There was an error in creating your account. Please try again.`});
						}
						message = `You have successfully created an account with the username '${username}' and have been granted $10,000 USD. Head over to the login page.`;
						response.render('registration.hbs', {title: message});
					});
				});
			}
			else {
				message = `The username '${username}' already exists within the system.`;
				response.render('registration.hbs', {title: `The username '${username}' already exists within the system.`});
			}

		}

	)};
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
	response.render('trading-success.hbs', {
		title: 'Welcome to the trading page.'
	})
});

app.get('/history', isAuthenticated, (request, response) => {
	response.render('history.hbs', {
		title: 'Welcome to the Histoy page.'
	})
});

app.post('/trading-success-search', isAuthenticated, (request, response) => {

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
			// const stock_historical_info = await axios.get(`https://www.quandl.com/api/v3/datasets/WIKI/${stock_ticker}/data.json?api_key=rshVxygxzFwYapTQCrAy`)
			const stock_historical_info = await axios.get(`https://api.iextrading.com/1.0/stock/${stock_ticker}/chart/1y`);

			stock_name = stock_info.data.companyName;
			var stock_price = stock_info.data.latestPrice;
			var historical_data = stock_historical_info.data;

			for (var num = historical_data.length - 1; num >= 33; num -= 5) {
				// console.log('fa', num);
				hist_date = historical_data[num].date
				day = hist_date.slice(6,10)
				dates.push(day);
				historical_prices.push(historical_data[num].close);
			}

			// console.log('Here are the dates:');
			console.log(dates);
			console.log(historical_prices);
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
				check: check
				})
	}
	get_stock_info(stock);
});

app.post('/trading-success-buy', isAuthenticated, (request, response) => {

	var _id = request.session.passport.user._id;
	var qty = request.body.buystockqty;
	var stock = (request.body.buystockticker).toUpperCase();
	var stocks = request.session.passport.user.stocks;
	var cash = request.session.passport.user.cash;

	const buy_stock = async () => {

		var index = check_existence(stock);

		try {		
			const stock_info = await axios.get(`https://cloud.iexapis.com/beta/stock/${stock}/quote?token=sk_291eaf03571b4f0489b0198ac1af487d`);
			var stock_name = stock_info.data.companyName;
			var stock_price = stock_info.data.latestPrice;
			var total_cost = Math.round(stock_price*qty*100)/100;
			var cash_remaining = Math.round((cash - total_cost)*100)/100;
			var stock_holding = {[stock]:parseInt(qty)};

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
				console.log('cash_remaining before update:'+cash_remaining);

				db.collection('user_accounts').updateOne(
					{ "_id": ObjectID(_id)},
					{ $set: { "cash": cash, "stocks": stocks}}
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
						head: `Cash balance: $${cash[0]}`
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

app.post('/trading-success-sell', isAuthenticated, (request, response) => {

	var _id = request.session.passport.user._id;
	var cash = request.session.passport.user.cash;
	var qty = parseInt(request.body.sellstockqty);
	var stock = (request.body.sellstockticker).toUpperCase();
	var stocks = request.session.passport.user.stocks;

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

				db.collection('user_accounts').updateOne(
						{ "_id": ObjectID(_id)},
						{ $set: { "cash": cash, "stocks": stocks}}
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
			head: `Cash balance: $${cash[0]}`
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
		head: `Cash: $${cash[0]}`
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
    response.render('admin-success', {
    	title: 'Welcome to the Admin Page'
    });
 });

app.post('/admin-success-user-accounts', isAdmin, function(req, res, next) {
	mongoose.connect("mongodb://localhost:27017/accounts", function(err, db) {
		assert.equal(null, err);
		db.collection('user_accounts').find().toArray(function(err, result) {
			if (err) {
				res.send('Unable to fetch Accounts');
			}
			res.render('admin-success-user-accounts-list.hbs', {
				result: result
			});
		});
		db.close;
	});
});

app.post('/admin-success-delete-user', isAdmin, function(req, res, next) {
	mongoose.connect("mongodb://localhost:27017/accounts", function(err, db) {
		assert.equal(null, err);
		db.collection('user_accounts').find().toArray(function(err, result) {
			if(err) {
				res.send('Unable to fetch Accounts');
			}
			res.render('admin-success-delete-user-success.hbs', {
				result: result
			});
		});
		db.close;
	})});

app.post('/admin-success-delete-user-success', function(req, res, next) {
	var user_name_to_delete = req.body.user_id;
	var username = req.session.passport.user.username;

	console.log(user_name_to_delete)
	console.log(username)
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
				mongoose.connect("mongodb://localhost:27017/accounts", function(err, db) {
					assert.equal(null, err);

					var query = { username: user_name_to_delete }

					db.collection('user_accounts').find(query).toArray(function(err, result) {
						if(err) {
							message = 'Unable to Delete Account';
							console.log(message)
							// console.log(err);
							res.render('admin-success-delete-user-success.hbs', {
								message: message
							});
						};

						if(result === undefined || result.length == 0) {
							message = 'No user exists with that username';
							console.log(message)
							res.render('admin-success-delete-user-success.hbs', {
								message: message
							});
						}else {
							db.collection('user_accounts').deleteOne(query, function(err, obj) {
								if(err) throw err;
								console.log("User Deleted");
								message ='User is Deleted';
								res.render('admin-success-delete-user-success.hbs', {
								message: message
							});
								db.close();
							});
						};
					});
				});

			};
		};
});

app.get('/admin-success-update-balances', isAdmin, function(req, res, next) {
	res.render('admin-success-update-balances.hbs', {
		message: 'Enter the user ID and cash you would like to change to.'
	});
});

app.post('/admin-success-update-balances', isAdmin, function(req, res, next) {
	var user_id = req.body.user_id;
	var new_balance = req.body.user_balance;
	var balance_to_list = [new_balance];
	var message;

	console.log(new_balance);

	if (new_balance > 0) {

		try {
			db.collection('user_accounts').findOne({_id: user_id}, function(err, result) {

				if (result !== null) {

					db.collection('user_accounts').updateOne(
						{ "_id": ObjectID(_id)},
						{ $set: {"cash": balance_to_list}}
					);

					message = `ID: ${user_id} cash has been changed to ${new_balance}.`
				}
			})
		}
		catch(err) {
			message = `User ID doesn't exist.`;
		}
	}
	else {
		message = `Number must be greater than 0.`;
	}

	res.render('admin-success-update-balances.hbs', {
		message: message
	});
})

app.post('/admin-success-update-balances', isAdmin, function(req, res, next) {
	mongoose.connect("mongodb://localhost:27017/accounts", function(err, db) {
		assert.equal(null, err);
		db.collection('user_accounts').find().toArray(function(err, result) {
			if (err) {
				res.send('Unable to fetch Accounts');
			}
			res.render('admin-success-update-balances.hbs', {
				result: result
			});
		});
		db.close;
	});
});

app.post('/admin-success-update-balances-success', isAdmin, function(req, res, next){
	var user_id_to_update = req.body.user_id
	var user_balance = parseInt(req.body.user_balance)
	console.log(user_balance);
	var balance_to_list = []
	balance_to_list[0] = user_balance
	console.log(balance_to_list[0]);
	if(user_id_to_update == '') {
		res.render('admin-success-update-balances-success.hbs', {
			message: "Cannot be empty"
		});
	}else{
	console.log(user_id_to_update);
		message = '';
		mongoose.connect("mongodb://localhost:27017/accounts", function(err, db) {
			assert.equal(null, err);
			var query = { _id: ObjectID(user_id_to_update) }
			
			db.collection('user_accounts').findOne(query).toArray(function(err, result) {
				if(err) {
					message = 'Unable to Update Account';
					console.log(message)
				
					res.render('admin-success-update-balances-success.hbs', {
						message: message
					});
				}

				if(result === undefined || result.length == 0) {
					message = 'No user exists with that Id';
					console.log(message)
					res.render('admin-success-update-balances-success.hbs', {
						message: message
					});
				}else {
					db.collection('user_accounts').updateOne(
						{ "_id": user_id_to_update},
						{ $set: { "cash": balance_to_list }

				})
					res.render('admin-success-update-balances-success.hbs', {
						message: 'Update Successfully'
				});
				}
			})
		})
	}})

// redirects user to error page if no user is logged in and trying to access a different page
app.get('*', errorPage, (request, response) => {
	response.render('404.hbs', {
		title: `Sorry the URL 'localhost:8080${request.url}' does not exist.`
	})
});

function errorPage(request, response, next) {
	if (request.session.passport !== undefined) {
		console.log(request.session.passport);
		next();
	} else {
		response.render('404x.hbs', {
			title: `Sorry the URL 'localhost:8080${request.url}' does not exist.`
		})
	}
}

function isAuthenticated(request, response, next) {
	if (request.session.passport !== undefined) {
		console.log(request.session.passport);
		next();
	} else {
		response.redirect('/');
	}
}

function isAdmin(request, response, next) {
	if ((request.session.passport !== undefined) && (request.session.passport.user.type === 'admin')) {
		console.log(request.session.passport);
		next();
	} else {
		response.redirect('/admin-restricted');
	}
}

// listen to port 8080
app.listen(8080, () => {
	console.log('Server is up on port 8080');
	utils.init();
});