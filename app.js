/**
 * Tweets it real good twitter: emdog4 2017 license: public domain
 */

require('dotenv').load();

var express = require('express');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);


var app = express();

var store = new MongoDBStore({ uri: 'mongodb://localhost:27017/tirg', collection: 'sessions' });

//Catch errors 
store.on('error', function(error) {
	if (error) console.log(error);
	assert.ifError(error);
	assert.ok(false);
});

app.use(require('express-session')({
    secret: process.env.APP_COOKIE_SECRET,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 14 // 2 weeks
    },
    store: store,
    resave: false,
    saveUninitialized: false
  }));

//parser application/x-www-form-urlencoded and application/json
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());

const path = require('path');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(require('morgan')('combined'));

// Twitter Oauth endpoints
var requestTokenEndpoint = 'https://api.twitter.com/oauth/request_token';
var authenticateEndpoint = 'https://api.twitter.com/oauth/authenticate';
var accessTokenEndpoint  = "https://api.twitter.com/oauth/access_token";

// Twitter API endpoints
var timelineUrl = 'https://api.twitter.com/1.1/statuses/user_timeline.json';
var tweetUrl = 'https://api.twitter.com/1.1/statuses/update.json';
var verifyCredentialsEndpoint ='https://api.twitter.com/1.1/account/verify_credentials.json';

var request = require('request'); 
const querystring = require('querystring');

var OAuth = require('oauth');




var Twitter = require('twitter');

app.get('/authorized', function(req, res) {
	
	res.render('auth_home', { username : req.session.screen_name });
	
});


app.get('/', function(req, res) {
	
	console.log('entering app get /');

	// Do we already have a browser session?

	if (typeof(req.session.oauth_token) != "undefined" && typeof(req.session.oauth_token_secret) != "undefined") {

		// Let's verify the credentials
		
		request.get({ url : verifyCredentialsEndpoint, oauth : getOAuth(req) }, function(error, response, body) {
			
			if (error) { console.log(error); return; }
				
			if (response.statusCode < 200 && response.statusCode > 299) {
				
				console.log('credentials verified!');
				
				res.redirect('/authorized');
				return;
			}
		});
			
	}
		
	// Credentials not verified
	/*
	console.log('destroying session');
	
	req.session.destroy(req.session._id, function(error) {
		
		if (error) console.log(error);
		
		res.redirect('/');
	});
*/
	// No browser session found
	
	console.log('proceeding to Sign in with Twitter...');
	
	// Oauth Step 1: Request Token
	
	var dict = {
		consumer_key : process.env.TWITTER_CONSUMER_KEY,
		consumer_secret : process.env.TWITTER_CONSUMER_SECRET
	}
	
	request.post({ url : requestTokenEndpoint, oauth : dict }, function(error, response, body) {

		if (error) console.log(error);

		var keys = querystring.parse(body);
		
		console.log('body: ' + body);
		console.log('oauth token: ' + keys.oauth_token);
		console.log('oauth token secret: ' + keys.oauth_token_secret);

		req.session.oauth_token = keys.oauth_token;
		req.session.oauth_token_secret = keys.oauth_token_secret;
		
		var signInWithTwitterURL = authenticateEndpoint + '?' + querystring.stringify({ oauth_token : req.session.oauth_token });
		
		console.log('sign in with twitter url: ' + signInWithTwitterURL);
		
		// Oauth Step 2: User clicks link to Authenticate --> Sign in with Twitter
		
		res.render('public_index', { url : signInWithTwitterURL });
	});
	
	
});


app.get('/signin-with-twitter', function(req, res) {
	
	// This is the Sign in with Twitter callback
	
	req.session.oauth_verifier = req.query.oauth_verifier;
	
	var dict = {
		consumer_key : process.env.TWITTER_CONSUMER_KEY,
		consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
		token : req.session.oauth_token,
		token_secret : req.session.oauth_token_secret,
		verifier : req.session.oauth_verifier,
		callback : 'http://localhost:3000/signin-with-twitter'
	}
	
	// OAuth Step 3: Access Token
	request.post({ url : accessTokenEndpoint , oauth : dict }, function(error, response, body) {
		
		if (error) console.log(error);
		
		console.log('oauth success!');
		
		var authenticatedData = querystring.parse(body);
		req.session.screen_name = authenticatedData.screen_name;

		
		res.redirect('/authorized');
	});
	
});


app.use('/', express.static(path.join(__dirname, 'public')));

module.exports = app;
