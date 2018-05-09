const PORT = process.env.PORT || 3000
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

var sockets = [];
var socketIDs = [];
var userNicknames = [];
var userTimeouts = [];
var guestsIterator = 0;

const WELCOME_MSG = "Welcome to the chat room!"
const TYPING_TIMEOUT = 500;

io.on('connection', function(socket) {
	socket.emit('reset chat');
	socket.emit('welcome message', WELCOME_MSG);

	sockets.push(socket);
	socketIDs.push(socket.id);
	var nickname = '';
	userNicknames.push(nickname);
	userTimeouts.push(0);
	var onlineUserData = getOnlineUsersData();
	io.emit('users online', onlineUserData);

	socket.on('chat message', function(message){
		if (message) {
			var index = socketIDs.indexOf(socket.id);
			var nickname = userNicknames[index];
			if (nickname) {
				var data = { message: message, nickname: nickname };
				socket.broadcast.emit('chat message', data);
				userTimeouts[index] = 0;
			}
		}
  });

	socket.on('typing', function(){
		var index = socketIDs.indexOf(socket.id);
		userTimeouts[index] = TYPING_TIMEOUT;
	});

  socket.on('disconnect', function(){
  	var index = socketIDs.indexOf(socket.id);
  	var nickname = userNicknames[index];
  	if (nickname) {
  		io.emit('notification message', '<strong>' + nickname + '</strong> left the room.');
  	}
    sockets.splice(index, 1);
    socketIDs.splice(index, 1);
    userNicknames.splice(index, 1);
    userTimeouts.splice(index, 1);

    var onlineUserData = getOnlineUsersData();
	io.emit('users online', onlineUserData);
  });

	socket.on('request nickname', function(newNickname) {
		var verified = verifyNickname(newNickname);
		if (verified == true) {
		  	if (userNicknames.indexOf(newNickname) == -1) {
		  		var index = socketIDs.indexOf(socket.id);
		  		var oldNickname = userNicknames[index];
		  		userNicknames[index] = newNickname;
		  		socket.emit('nickname assign', newNickname);
		  		io.emit('notification message', '<strong>' + newNickname + '</strong> joined the room.');

				var onlineUserData = getOnlineUsersData();
				io.emit('users online', onlineUserData);
	  	} else {
	  		// sendErrorMessage(socket, 'Nickname [' + newNickname + '] already exists.');
	  	}
	  } else {
	  	// sendErrorMessage(socket, 'Invalid nickname.');
	  }
	});
});

function sendErrorMessage(socket, message) {
	socket.emit('error message', message);
}

function verifyNickname (nickname) {
	var nicknameLength = nickname.length;

	if (nicknameLength > 15) {
		return false;
	}

	if (nickname[0] == ' ') {
		return false;
	}

	if (nickname[nicknameLength - 1] == ' ') {
		return false;
	}

	return true;
}

http.listen(PORT, function(){
	console.log(`Listening on ${ PORT }`);
});

function generateNickname() {
	var nickname = 'Guest' + guestsIterator;
	while (userNicknames.indexOf(nickname) != -1) {
		guestsIterator++;
		nickname = 'Guest' + guestsIterator;
	}

	return nickname;
}

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

function getOnlineUsersData() {
	var usersOnline = userNicknames.filter(nickname => nickname != '');
	var numUsersOnline = usersOnline.length;
	var result = {
		numUsersOnline: numUsersOnline,
		userNicknames: usersOnline
	};

	return result;
}