
function matchTweet() 
{
	autosize(this);

	var re = /(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])((?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])){0,140}[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g;
	
	var tweets = $(this).val().match(re);
	
	if (tweets) 
	{
		var form = $('#tweets_array');
		
		form.empty();
		
		if(!reversed) 
		{
			tweets = tweets.reverse();
		}
				
		tweets.forEach(function(tweet) 
		{
			$(form).append('<input type="text" value="' + tweet + '" name="tweets" readonly>');
		});
	}
}

function resetTextarea() 
{
	var ta = $(this).find('textarea')[0];

	$(ta).text('').focus();
	
	$('#tweets_array').empty();
	
	autosize.update(ta);
}


var reversed = true;

function reverseTweets(element)
{
	reversed = !reversed;
	
	$('#input textarea').trigger('propertychange');
}


// Bind events

$(document).ready(function() 
{
    $('#input textarea').on('input propertychange', matchTweet);
    
    $('#input').on('reset', resetTextarea);

});

$(document).on('input propertychange', '#input textarea', matchTweet);

$(document).on('click', '#reverse', reverseTweets);

//'" name="tweets.' + count + 