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

const WELCOME_MSG = "Welcome to John's chat room!"
const TYPING_TIMEOUT = 500;

io.on('connection', function(socket) {
	socket.emit('clear messages');
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

	socket.on('typing', function(){
		var id = socketIDs.indexOf(socket.id);
		userTimeouts[id] = TYPING_TIMEOUT;
	});

  socket.on('disconnect', function(){
  	var id = socketIDs.indexOf(socket.id);
    sockets.splice(id, 1);
    socketIDs.splice(id, 1);
    userNicknames.splice(id, 1);
    userTimeouts.splice(id, 1);
  });

  socket.on('loaded', function() {
  	var id = socketIDs.indexOf(socket.id);
  	var nickname = generateNickname();
		userNicknames[id] = nickname;

		socket.emit('nickname assign', nickname);
  });

  socket.on('request nickname', function(newNickname) {
  	var verified = verifyNickname(newNickname);
  	if (verified == true && userNicknames.indexOf(newNickname) == -1) {
  		var id = socketIDs.indexOf(socket.id);
  		userNicknames[id] = newNickname;
  		socket.emit('nickname assign', newNickname);
  	}
  });
});

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