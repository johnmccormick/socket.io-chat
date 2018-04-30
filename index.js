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
	socket.emit('clear messages');
	socket.emit('welcome message', WELCOME_MSG);

	sockets.push(socket);
	socketIDs.push(socket.id);
	var nickname = generateNickname();
	userNicknames.push(nickname);
	userTimeouts.push(0);

	var numUsersOnline = sockets.length;
	io.emit('users online', numUsersOnline);

	socket.emit('nickname assign', nickname);
	socket.broadcast.emit('notification message', nickname + ' joined the room.');

	socket.on('chat message', function(message){
		if (message) {
			var index = socketIDs.indexOf(socket.id);
			var nickname = userNicknames[index];
			var data = { message: message, nickname: nickname };
			socket.broadcast.emit('chat message', data);
			userTimeouts[index] = 0;
		}
  });

	socket.on('typing', function(){
		var index = socketIDs.indexOf(socket.id);
		userTimeouts[index] = TYPING_TIMEOUT;
	});

  socket.on('disconnect', function(){
  	var index = socketIDs.indexOf(socket.id);
    sockets.splice(index, 1);
    socketIDs.splice(index, 1);
    userNicknames.splice(index, 1);
    userTimeouts.splice(index, 1);

    var numUsersOnline = sockets.length ;
		io.emit('users online', numUsersOnline);
  });

  socket.on('request nickname', function(newNickname) {
  	var verified = verifyNickname(newNickname);
  	if (verified == true) {
	  	if (userNicknames.indexOf(newNickname) == -1) {
	  		var index = socketIDs.indexOf(socket.id);
	  		var oldNickname = userNicknames[index];
	  		userNicknames[index] = newNickname;
	  		socket.emit('nickname assign', newNickname);
	  		io.emit('notification message', oldNickname + ' changed their nickname to ' + newNickname + '.');
	  	} else {
	  		sendErrorMessage(socket, 'Nickname [' + newNickname + '] already exists.');
	  	}
	  } else {
	  	sendErrorMessage(socket, 'Invalid nickname.');
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

http.listen(3000, function(){
  console.log('listening on *:3000');
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