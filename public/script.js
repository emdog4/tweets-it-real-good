
$(document).ready(function() {
    console.log('ready!');
    
    $('#input textarea').on('keydown focus', function() {
    	autosize(this);
    	
    	var preview = $('#tweets');
    	
    	var re = /(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])((?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])){0,140}[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g;
    	
    	var tweets = $(this).val().match(re);
    	
    	if (tweets) {
	    	tweets.forEach(function(item) {
	    		$(preview).append('<div class="tweet">' + item + '</div>');
	    	});
    	}
    	
    });
    
    $('#input').on('reset', function() {
    	var ta = $(this).find('textarea')[0];
    	$(ta).text('').focus();
    	autosize.update(ta);
    });
    
    
});