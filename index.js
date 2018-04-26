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
const TYPING_TIMEOUT = 2000;

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
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

const TIMEOUT_UPDATE_INTERVAL = 1000;

setInterval(function() {
	var typingOutput = '';
	var numTyping = 0;
	var numUsers = userTimeouts.length;
	
	for (var i = 0; i < numUsers; i++) {
		if (userTimeouts[i] > 0) {
			userTimeouts[i] -= TIMEOUT_UPDATE_INTERVAL;
			var socket = sockets[i];
			var nickname = userNicknames[i];
			if (numTyping > 0) {
				typingOutput += ', ' + nickname ;
			} else {
				typingOutput += nickname ;
			}
			
			numTyping += 1;
		}
	}

	if (numTyping == 1) {
		typingOutput += ' is typing.';
	} else if (numTyping > 1) {
		typingOutput += ' are typing.';
	} 

	if (numTyping > 0) {
		console.log(typingOutput);
	}

	io.emit("typing output", typingOutput)

}, TIMEOUT_UPDATE_INTERVAL);