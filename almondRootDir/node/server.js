var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

var Devices = require('./devices.js').Devices


var devices = new Devices();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){  
	console.log('a user connected');
		socket.on('disconnect', function(){
		console.log('user disconnected');
	});

  // setInterval(function(){
  // 	var file = (JSON.parse(fs.readFileSync("./DeviceList.json", "utf8")))
  // 	console.log(typeof file)
  //   socket.emit('feedback', file);
  // }, 5000);

	devices.on('change', function(devices){
		var deviceJSON = devices.devicesJson;
    	socket.emit('feedback', deviceJSON);
	})


});



http.listen(1337, function(){
  console.log('listening on *:1337');
});



