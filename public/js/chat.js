var socket = io();

var message = document.getElementById('m'),
    nickname = document.getElementById('n'),
    form = document.getElementById('form'),
    send = document.getElementById('send'),
    messages = document.getElementById('messages'),
    typing = document.getElementById('typing');

form.onsubmit = function() {
  if (message.value) {
    socket.emit('chat message', { 
      message: message.value,
      nickname: nickname.value,
    });
    addChatMessage(message.value, "You");
    message.value = "";
  }
  return false;
};

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

function addChatMessage(message, nickname) {
  messages.innerHTML += "<li>" + nickname + ": " + message + "</li>";
  window.scrollTo(0, document.body.scrollHeight);
}