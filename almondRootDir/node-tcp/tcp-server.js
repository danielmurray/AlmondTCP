var net = require('net');
var JsonSocket = require('./lib/json-socket.js');

var Devices = require('./lib/devices/devices.js').Devices
var devices = new Devices();
devices.connect();

var port = 1337;
var server = net.createServer();
server.listen(port);

server.on('connection', function(socket) {
    socket = new JsonSocket(socket);
    
    console.log("New connection from " + socket._socket.remoteAddress +':'+ socket._socket.remotePort);
    

 //    socket.on('fetch', function(data){
	// 	console.log('fetch');
	// 	var response = {
	// 	  success: true,
	// 	  data: devices.toJSON()
	// 	}
	// 	socket.emit('fetch', response)
	// });

    socket.on('message', function(message) {
        console.log('fetch');
		var response = {
		  success: true,
		  data: devices.toJSON()
		}
		// socket.emit('fetch', response)
		socket.sendMessage(response);
    });

	devices.on('change', function(devices){
		console.log('CHANGE!') 
		var deviceJSON = devices.toJSONObj();
		console.log(deviceJSON) 
		// socket.emit('update', deviceJSON);
		socket.sendMessage(deviceJSON);
	})
});