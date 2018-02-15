$(document).ready(function(){
	$("#authorize_spotify").click(function(event){
		window.location.href = "login";
	})

	$('#create_playlist').click(function(event){
		window.location.href = 'create_playlist'
	})

	function http(url, method, successCallback, errorHandler){
		setTimeout(function(){
			var data = 'defined data to get back';
			if (data) {
				successCallback(data)
			}else{
				errorHandler('No Data')
			}
		}, 1000)
	}

	http('http://google.com', 'GET', function(data){
		console.log(data);
	}, function(err){
		console.log(err)
	});

	// var url = window.location.href,
  // access_token = url.match(/\#(?:access_token)\=([\S\s]*?)\&/)[1];
	// if(access_token !== null){
	// 	console.log(access_token)
	// }
})
