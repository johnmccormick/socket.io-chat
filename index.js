var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

var sockets = [];
var socketIDs = [];
var userNicknames = [];
var userTimeouts = [];

const WELCOME_MSG = "Welcome to John's chat room!"
const TYPING_TIMEOUT = 12200;

io.on('connection', function(socket) {
	socket.emit('welcome message', WELCOME_MSG);

	sockets.push(socket);
	socketIDs.push(socket.id);
	userNicknames.push('');
	userTimeouts.push(0);

	socket.on('chat message', function(msg){
		if (msg['message']) {
			socket.broadcast.emit('chat message', msg);
			
			var id = socketIDs.indexOf(socket.id);
			userTimeouts[id] = 0;
		}
  });

	socket.on('typing', function(nickname){
		var id = socketIDs.indexOf(socket.id);
		userTimeouts[id] = TYPING_TIMEOUT;
		userNicknames[id] = nickname;
	});

  socket.on('disconnect', function(){
  	var id = socketIDs.indexOf(socket.id);
    sockets.splice(id, 1);
    socketIDs.splice(id, 1);
    userNicknames.splice(id, 1);
    userTimeouts.splice(id, 1);
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});

const TIMEOUT_UPDATE_INTERVAL = 50;

setInterval(function() {

	var numUsersTyping = 0;
	var usersTyping = [];

	var numUsers = sockets.length;
	for (var i = 0; i < numUsers; i++) {
		if (userTimeouts[i] > 0) {
			userTimeouts[i] -= TIMEOUT_UPDATE_INTERVAL;
			numUsersTyping += 1;
			usersTyping.push(userNicknames[i]);
		}
	}

	var typingData = { nicknames: usersTyping, numUsersTyping: numUsersTyping }

	io.emit('typing data', typingData);

}, TIMEOUT_UPDATE_INTERVAL);