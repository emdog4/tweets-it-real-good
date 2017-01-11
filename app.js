/**
 * Tweets it real good twitter: emdog4 2017 license: public domain
 */

require('dotenv').load();

var express = require('express');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);

var app = express();

app.use(require('helmet')());

var store = new MongoDBStore({ uri: 'mongodb://localhost:27017/tirg', collection: 'sessions' });

store.on('error', function(error) {
	if (error) console.log(error);
	assert.ifError(error);
	assert.ok(false);
});

app.use(session({
    secret	: process.env.APP_COOKIE_SECRET,
    cookie	: { maxAge: 1000 * 60 * 60 * 24 * 14 }, // 2 weeks
    store	: store,
    resave	: false,
    saveUninitialized	: false
 }));

//parser application/x-www-form-urlencoded and application/json
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());

const path = require('path');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(require('morgan')('dev'));

// Twitter Oauth endpoints
var requestTokenEndpoint = 'https://api.twitter.com/oauth/request_token';
var authenticateEndpoint = 'https://api.twitter.com/oauth/authenticate';
var accessTokenEndpoint  = "https://api.twitter.com/oauth/access_token";

// Twitter API endpoints
var timelineUrl 				= 'https://api.twitter.com/1.1/statuses/user_timeline.json';
var tweetUrl 					= 'https://api.twitter.com/1.1/statuses/update.json';
var verifyCredentialsEndpoint 	= 'https://api.twitter.com/1.1/account/verify_credentials.json';

var Twitter = require('twitter');

const punycode = require('punycode');

var request = require('request'); 
const querystring = require('querystring');

var OAuth = require('oauth');


function verifyCredentials(req, res, next) {
	
	// Do we already have a browser session?
	
	if (typeof(req.session.oauth_token) == "undefined" || typeof(req.session.oauth_token_secret) == "undefined") {

		console.log('no session detected');
		
		res.redirect('/login');
	} 
	
	console.log('session detected');
	
	// Oauth data struct
	
	var dict = {
		consumer_key 	: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
		token 			: req.session.oauth_token,
		token_secret 	: req.session.oauth_token_secret
	}
			 
	console.log('verifying session');
	
	// Let's verify the session credentials
	
	request.get({ url : verifyCredentialsEndpoint, oauth : dict }, function(error, response, body) {
	
		console.log('response status code: ' + response.statusCode);

		if (error) console.error(error);
		
		switch (response.statusCode) {
			case 200:
				console.log('credentials verified!');
				next(); break;
			case 401:
			default:
				console.error('invalid credentials');
				res.redirect('/logout');
		}
	});
}


function numberOfCodepoints(string) {
	
	if (typeof(string) == "undefined") return 0;
	
	if (string.length == 0) return 0;
	
	var normalized = string.normalize('NFC');
	
	return punycode.ucs2.decode(normalized).length;
}





app.get('/', verifyCredentials, function(req, res) {
	
	res.render('authorized', { username : req.session.screen_name });
});


app.get('/logout', function(req, res) {

	console.log('proceeding to logout');
	
	req.session.destroy(function(error) {
		
		if (error) console.error(error);
		
		console.log('session destroyed');

		res.redirect('/login');
	});
});


var tweets = [];

function splitTweets(tweet) {
	
	if (tweet.length == 0) return tweets;
	
	tweets.push(tweet.slice(0, 140));
	
	console.log(tweets.length);
	
	splitTweets(tweet.slice(140));
}

app.post('/preview', verifyCredentials, function(req, res) {

	console.log('proceeding to preview');
	
	// Split tweet
	
	var data = req.body.tweet;
	
	console.log('tweet contains	: ' + numberOfCodepoints(data) + ' chars');
	
	var tweets = data.match(new RegExp('.{1,140}', 'g'));
	
	console.log('tweets split	: ' + tweets.length);
	
	res.render('preview', { username : req.session.screen_name, tweets : tweets });
});


app.get('/login', function(req, res) {
	
	console.log('proceeding with sign in');

	// Oauth Step 1: Request Token

	var dict = {
		consumer_key 	: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
		oauth_callback 	: process.env.APP_SIWT_CALLBACK
	}
	
	request.post({ url : requestTokenEndpoint, oauth : dict }, function(error, response, body) {

		if (error) console.error(error);

		var data = querystring.parse(body);
		
		console.log('oauth callback confirmed: ' + data.oauth_callback_confirmed);
		
		req.session.oauth_token 		= data.oauth_token;
		req.session.oauth_token_secret 	= data.oauth_token_secret;
	
		console.log('request tokens obtained!');

		var signInWithTwitterURL = authenticateEndpoint + '?' + querystring.stringify({ oauth_token : req.session.oauth_token });
		
		// Oauth Step 2: User clicks link to Authenticate --> Sign in with Twitter
		
		res.render('index', { url : signInWithTwitterURL });
	});
	
});


app.get('/signin-with-twitter', function(req, res) {
	
	// Sign in with Twitter callback
	
	req.session.oauth_verifier = req.query.oauth_verifier;

	console.log('verifier obtained!');
	
	var dict = {
		consumer_key 	: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
		token 			: req.session.oauth_token,
		token_secret 	: req.session.oauth_token_secret,
		verifier 		: req.session.oauth_verifier
	}
	
	// OAuth Step 3: Access Token
	
	request.post({ url : accessTokenEndpoint , oauth : dict }, function(error, response, body) {
		
		if (error) console.error(error);
		
		var data = querystring.parse(body);
		
		req.session.oauth_token 		= data.oauth_token;
		req.session.oauth_token_secret 	= data.oauth_token_secret;
		req.session.screen_name 		= data.screen_name;

		console.log('access token obtained!');

		res.redirect('/');
	});
});


app.use('/', express.static(path.join(__dirname, 'public')));

module.exports = app;
