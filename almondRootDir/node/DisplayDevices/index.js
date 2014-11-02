var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){  
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  setInterval(function(){
  	var file = (JSON.parse(fs.readFileSync("./DeviceList.json", "utf8")))
    socket.emit('feedback', file);
  }, 1000);


});



http.listen(1337, function(){
  console.log('listening on *:1337');
});
