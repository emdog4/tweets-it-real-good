/**
* Tweets it real good twitter: emdog4 2017 license: public domain
 */

require('dotenv').load();

var express = require('express');
var cookieSession = require('cookie-session');

var app = express();

app.use(require('helmet')());

app.use(cookieSession({ name: 'session', keys: [process.env.APP_COOKIE_SECRET], maxAge: 24 * 60 * 60 * 1000 }));

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
		res.redirect('/login'); return;
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
			console.error(error);
		} 
		else 
		{
			switch (response.statusCode) 
			{
				case 200:
					next(); break;
				case 401:
				default:
					console.error('invalid credentials'); res.redirect('/logout'); return;
			}
		}
		
	});
}

var twitter;

function initTwitterClient(req, res, next) 
{
	if (!twitter)
	{
		twitter = new Twitter({ consumer_key: process.env.TWITTER_CONSUMER_KEY,	consumer_secret: process.env.TWITTER_CONSUMER_SECRET, access_token_key: req.session.oauth_token, access_token_secret: req.session.oauth_token_secret });
	}
	
	next();
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
			console.error(error);
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
			console.error(error);
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
	req.session = null;
	
	res.redirect('/login');
});


app.post('/update', verifyCredentials, initTwitterClient, function(req, res) 
{	
	var tweets = req.body.tweets;
		
	console.log(tweets);
	
	if (typeof(tweets) == 'object') 
	{		
		tweets.forEach(function(tweet) 
		{		
			var params = { status: tweet, trim_user: 'true' };
			
			twitter.post('statuses/update', params,  function(error, twt, response) 
			{
				if(error) console.error(error);
				
				console.log(twt); 
			});
		});
	} 
	else 
	{	
		var params = { status: tweets, trim_user: 'true' };
		
		twitter.post('statuses/update', params,  function(error, twt, response) 
		{
			if(error) console.error(error);
			
			console.log(twt); 
		});	
	}
	res.redirect('/');
});


app.get('/home_timeline', verifyCredentials, initTwitterClient, function(req, res) 
{	
	var params = { count: 30 };
	
	twitter.get('statuses/home_timeline', params, function(error, twt, response) 
	{
		if(error) console.error(error);
		
		console.log(twt);  
		
		res.redirect('/');
	});
});


app.get('/user_timeline', verifyCredentials, initTwitterClient, function(req, res) 
{	
	var params = { screen_name: req.session.user_name, count: 50, include_rts: 'true' };
	
	twitter.get('statuses/user_timeline', params, function(error, twt, response) 
	{
		if(error) console.error(error);
		
		console.log(twt);  
		
		res.redirect('/');
	});
});


app.use('/', express.static(path.join(__dirname, 'public')));

module.exports = app;
