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
const TYPING_TIMEOUT = 1000;

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

const TIMEOUT_UPDATE_INTERVAL = 500;

setInterval(function() {

	var numUsersTyping = 0;
	var usersTyping = [];
	var usersNotTyping = [];
	
	var nonTypersOutput = '';

	var numUsers = userTimeouts.length;
	for (var i = 0; i < numUsers; i++) {
		if (userTimeouts[i] > 0) {
			userTimeouts[i] -= TIMEOUT_UPDATE_INTERVAL;
			numUsersTyping += 1;
			usersTyping.push(i);
		} else {
			usersNotTyping.push(i);
		}
	}

	// output strings for typers
	for (var socketIndex = 0; socketIndex < numUsersTyping; socketIndex++) {
		var typingOutput = '';
		var ownMessageOffset = 0;

		var typingUsersInString = 0;
		for (var userIndex = 0; userIndex < numUsersTyping; userIndex++) {
			if (userIndex != socketIndex) {
				var id = usersTyping[userIndex];
				var nickname = userNicknames[id];

				if (userIndex - ownMessageOffset > 0) {
					if (typingUsersInString + 2 == numUsersTyping) {
						typingOutput += ' and ' + nickname;
					} else {
						typingOutput += ', ' + nickname;
					}
				} else {
					typingOutput += nickname ;
				}
				typingUsersInString += 1;
			} else {
				ownMessageOffset = 1;
			}

		}

		if (numUsersTyping == 2) {
			typingOutput += ' is typing.';
		} else if (numUsersTyping > 2) {
			typingOutput += ' are typing.';
		} 

		//socket emit message
		var socketID = usersTyping[socketIndex];
		var socket = sockets[socketID];
	
		socket.emit('typing output', typingOutput);
	}

	var typingOutput = '';
	// output string for non typers
	for (var userIndex = 0; userIndex < numUsersTyping; userIndex++) {
		var id = usersTyping[userIndex];
		var nickname = userNicknames[id];

		if (userIndex > 0) {
			if (userIndex + 1 == numUsersTyping) {
				typingOutput += ' and ' + nickname;
			} else {
				typingOutput += ', ' + nickname;
			}
		} else {
			typingOutput += nickname ;
		}
	}

	if (numUsersTyping == 1) {
		typingOutput += ' is typing.';
	} else if (numUsersTyping > 1) {
		typingOutput += ' are typing.';
	} 

	var numUsersNotTyping = usersNotTyping.length;
	for (var i = 0; i < numUsersNotTyping; i++) {
		var socketID = usersNotTyping[i];
		var socket = sockets[socketID];
	
		socket.emit('typing output', typingOutput);
	}

}, TIMEOUT_UPDATE_INTERVAL);