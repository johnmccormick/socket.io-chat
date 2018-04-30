var socket = io();

var message = document.getElementById('m'),
    nickname = document.getElementById('n'),
    form = document.getElementById('form'),
    send = document.getElementById('send'),
    messages = document.getElementById('messages'),
    typing = document.getElementById('typing'),
    saveButton = document.getElementById('save');

var storedNickname = nickname.value;

send.addEventListener('click', function() {
  sendMessage();
});

message.addEventListener('keydown', function(e) {
  if (e.keyCode == 13) {
    sendMessage();
  }
});

function sendMessage() {
  if (message.value) {
    socket.emit('chat message', { 
      message: message.value,
      nickname: nickname.value,
    });
    addChatMessage(message.value, "You");
    message.value = "";
  }
}

save.addEventListener('click', function() {
  requestNicknameUpdate();
});

nickname.addEventListener('keydown', function(e) {
  if (e.keyCode == 13) {
    requestNicknameUpdate();
  }
});

function requestNicknameUpdate() {
  var newNickname = nickname.value;
  socket.emit('request nickname', newNickname);
}

message.addEventListener('keypress', function(){
  socket.emit('typing', nickname.value);
});

socket.on('chat message', function(msg) {
  addChatMessage(msg['message'], msg['nickname']);
});

socket.on('typing data', function(data) {
  var numUsersTyping = data['numUsersTyping'];
  if (numUsersTyping > 0) {
    var thisNickname = nickname.value;
    var typerNicknames = data['nicknames'];

    var typingOutput = '';

    var thisTyperOffset = 0;
    if (typerNicknames.indexOf(thisNickname) > -1) { thisTyperOffset = 1; }
    
    var typingUsers = 0;
    for (var i = 0; i < numUsersTyping; i++) {
      if (typerNicknames[i] != thisNickname) {
        var stringConnector = '';
        if (typingUsers > 0) {
          if (typingUsers + thisTyperOffset + 1 == numUsersTyping) {
            stringConnector = ' and ';
          } else {
            stringConnector = ', ';
          }
        }

        typingOutput += stringConnector + typerNicknames[i];
        typingUsers += 1;
      } 
    }

    if (typingUsers > 0) {
      if (typingUsers > 1) {
        typingOutput += ' are typing...';
      } else if (typingUsers == 1) {
        typingOutput += ' is typing...';
      } 

      typing.style.display = 'block';
      typing.innerHTML = typingOutput;
      window.scrollTo(0, document.body.scrollHeight);
    }
    

  } else {
    typing.innerHTML = "";
    typing.style.display = 'none';
  }
});   

socket.on('clear messages', function(msg) {
  messages.innerHTML = '';
});

socket.on('welcome message', function(msg) {
  messages.innerHTML += '<li id="welcome">' + msg + '</li>';
});

socket.on('nickname assign', function(newNickname) {
  nickname.value = newNickname;
  hideSaveButton();
});

function addChatMessage(message, nickname) {
  messages.innerHTML += "<li>" + nickname + ": " + message + "</li>";
  window.scrollTo(0, document.body.scrollHeight);
}

nickname.addEventListener("input", function () {
  if (nickname.value && nickname.value != storedNickname) {
    showSaveButton();
  } else {
    hideSaveButton();
  }
});

function showSaveButton () {
  saveButton.style.display = 'inline-block';
}

function hideSaveButton () {
  saveButton.style.display = 'none';
}

// Loadup //
////////////
window.onload = function () {
  socket.emit('loaded');
};