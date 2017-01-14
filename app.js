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

app.use(session( { secret : process.env.APP_COOKIE_SECRET, cookie : { maxAge: 1000 * 60 * 60 * 24 * 14 }, store : store, resave : false, saveUninitialized : false } ));

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

function verifyCredentials(req, res, next) 
{
	if (typeof(req.session.oauth_token) == "undefined" || typeof(req.session.oauth_token_secret) == "undefined") 
	{
		res.redirect('/login');
	} 
		
	var dict = 
	{
		consumer_key 	: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
		token 			: req.session.oauth_token,
		token_secret 	: req.session.oauth_token_secret
	}
	
	request.get({ url : verifyCredentialsEndpoint, oauth : dict }, function(error, response, body) 
	{
		if (error) 
		{
			console.error(error); return;
		} 
		else 
		{
			switch (response.statusCode) 
			{
				case 200:
					next(); break;
				case 401:
				default:
					console.error('invalid credentials'); res.redirect('/logout');
			}
		}
		
	});
}


function verifyCredentials(req, res, next) 
{
	if (typeof(req.session.oauth_token) == "undefined" || typeof(req.session.oauth_token_secret) == "undefined") 
	{
		res.redirect('/login');
	} 
		
	var dict = 
	{
		consumer_key 	: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
		token 			: req.session.oauth_token,
		token_secret 	: req.session.oauth_token_secret
	}
	
	request.get({ url : verifyCredentialsEndpoint, oauth : dict }, function(error, response, body) 
	{
		if (error) 
		{
			console.error(error); return;
		} 
		else 
		{
			switch (response.statusCode) 
			{
				case 200:
					next(); break;
				case 401:
				default:
					console.error('invalid credentials'); res.redirect('/logout');
			}
		}
		
	});
}


//Routes // Routes // Routes // Routes // Routes
//Routes // Routes // Routes // Routes // Routes
//Routes // Routes // Routes // Routes // Routes
//Routes // Routes // Routes // Routes // Routes


app.get('/', verifyCredentials, function(req, res) 
{
	res.render('home', { username : req.session.screen_name, home_timeline : req.session.home_timeline });
});


app.get('/login', function(req, res) 
{
	var dict = 
	{
		consumer_key 	: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
		oauth_callback 	: process.env.APP_SIWT_CALLBACK
	}
	
	request.post({ url : requestTokenEndpoint, oauth : dict }, function(error, response, body) 
	{
		if (error) 
		{
			console.error(error); return;
		} 
		else 
		{
			var data = querystring.parse(body);
						
			req.session.oauth_token 		= data.oauth_token;
			req.session.oauth_token_secret 	= data.oauth_token_secret;
		
			var signInWithTwitterURL = authenticateEndpoint + '?' + querystring.stringify({ oauth_token : req.session.oauth_token });
						
			res.render('index', { url : signInWithTwitterURL, token : req.session.oauth_token });
		}
	});
});


app.get('/signin-with-twitter', function(req, res) 
{
	req.session.oauth_verifier = req.query.oauth_verifier;
	
	var dict = 
	{
		consumer_key 	: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret : process.env.TWITTER_CONSUMER_SECRET,
		token 			: req.session.oauth_token,
		token_secret 	: req.session.oauth_token_secret,
		verifier 		: req.session.oauth_verifier
	}
	
	request.post({ url : accessTokenEndpoint , oauth : dict }, function(error, response, body) 
	{
		if (error) 
		{
			console.error(error); return;
		} 
		else 
		{
			var data = querystring.parse(body);
			
			req.session.oauth_token 		= data.oauth_token;
			req.session.oauth_token_secret 	= data.oauth_token_secret;
			req.session.screen_name 		= data.screen_name;
	
			res.redirect('/');
		}
	});
});


app.get('/logout', function(req, res) 
{	
	req.session.destroy(function(error) 
	{
		if (error) 
		{
			console.error(error); return;
		} 
		else 
		{
			res.redirect('/login');
		}
	});
});



var twitter = new Twitter({ consumer_key: process.env.TWITTER_CONSUMER_KEY,	consumer_secret: process.env.TWITTER_CONSUMER_SECRET, access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY, access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET });


app.post('/update', function(req, res) 
{
	twitter.post('statuses/update', { status: req.body.tweet },  function(error, tweet, response) 
	{
		if (error) throw error;
		
		console.log(tweet); 
		console.log(response);
		
		res.redirect('/');
	});
});



app.get('/timeline', function(req, res) 
{	
	twitter.get('statuses/home_timeline', function(error, tweets, response) 
	{
		if(error) throw error;
		
		console.log(tweets);  
		console.log(response); 
		
		res.redirect('/');
	});
});

app.use('/', express.static(path.join(__dirname, 'public')));

module.exports = app;
