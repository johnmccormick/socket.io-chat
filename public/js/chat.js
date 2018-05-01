var socket = io();

var message = document.getElementById('m'),
    send = document.getElementById('send'),
    nickname = document.getElementById('n'),
    saveButton = document.getElementById('save'),
    form = document.getElementById('form'),
    numUsersOnlineInfo = document.getElementById('num-users-online-info'),
    userList = document.getElementById('user-list'),
    messages = document.getElementById('messages'),
    typingInfo = document.getElementById('typing-info');

var storedNickname = nickname.value;

message.addEventListener('keydown', function(e) {
  if (e.keyCode == 13) {
    sendMessage();
  }
});

send.addEventListener('click', function() {
  sendMessage();
});

message.addEventListener('input', function(){
  socket.emit('typing', nickname.value);
});

nickname.addEventListener('keydown', function(e) {
  if (e.keyCode == 13) {
    requestNicknameUpdate();
  }
});

save.addEventListener('click', function() {
  requestNicknameUpdate();
});

nickname.addEventListener("input", function () {
  if (nickname.value && nickname.value != storedNickname) {
    showSaveButton();
  } else {
    hideSaveButton();
  }
});

numUsersOnlineInfo.addEventListener("mouseover", function () {
  userList.style.display = 'block';
})

numUsersOnlineInfo.addEventListener("mouseout", function () {
  userList.style.display = 'none';
})

userList.addEventListener("mouseover", function () {
  userList.style.display = 'block';
})

userList.addEventListener("mouseout", function () {
  userList.style.display = 'none';
})

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

      typingInfo.style.display = 'block';
      typingInfo.innerHTML = typingOutput;
      scrollToBottom();
    }
    

  } else {
    typingInfo.innerHTML = "";
    typingInfo.style.display = 'none';
  }
});   

socket.on('nickname assign', function(newNickname) {
  nickname.value = newNickname;
  hideSaveButton();
});

socket.on('clear messages', function(msg) {
  messages.innerHTML = '';
});

socket.on('welcome message', function(msg) {
  messages.innerHTML += '<li id="welcome">' + msg + '</li>';
});

socket.on('users online', function(data) {
  var numUsersOnline = data['numUsersOnline'];
  var usersInfoString = ' users online';
  if (numUsersOnline == 1) {
    usersInfoString = ' user online';
  } 
  if (numUsersOnline > 0) {
    numUsersOnlineInfo.style.display = 'block';
    numUsersOnlineInfo.innerHTML = '<a href="#">' + numUsersOnline + usersInfoString + '.</a>';
    var numUsersOnlineInfoHeight = numUsersOnlineInfo.clientHeight;
    messages.style.paddingTop = numUsersOnlineInfoHeight + "px";
  } else {
    numUsersOnlineInfo.style.display = 'none';
    numUsersOnlineInfo.innerHTML = '';
  }
  populateOnlineUsersInfo(data);
});

socket.on('chat message', function(msg) {
  addChatMessage(msg['message'], msg['nickname']);
});

socket.on('error message', function(msg) {
  addErrorMessage(msg);
});

socket.on('notification message', function(msg) {
  addNotificationMessage(msg);
});

function sendMessage() {
  if (message.value) {
    socket.emit('chat message', message.value);
    addChatMessage(message.value, "You");
    message.value = "";
  }
}

function populateOnlineUsersInfo(data) {
  userList.innerHTML = '';
  var numUsersOnline = data['numUsersOnline'];
  var usersOnline = data['userNicknames'];
  for (var i = 0; i < numUsersOnline; i++) {
    userList.innerHTML += '<li><a href="#">' + usersOnline[i] + '</a></li>';
  }
  if (numUsersOnline < 22) {
    userList.style.overflowY = 'hidden';
  } else {
    userList.style.overflowY = 'scroll';
  }
}

function requestNicknameUpdate() {
  var newNickname = nickname.value;
  socket.emit('request nickname', newNickname);
}

function addChatMessage(message, nickname) {
  messages.innerHTML += '<li id"message">' + nickname + ': ' + message + '</li>';
  scrollToBottom();
}

function addNotificationMessage(message) {
  messages.innerHTML += '<li id="notification">' + message + '</li>';
  scrollToBottom();
}

function addErrorMessage(message) {
  messages.innerHTML += '<li id"error">' + message + '</li>';
  scrollToBottom();
}

function scrollToBottom() {
  window.scrollTo(0, document.body.scrollHeight);
}

function showSaveButton () {
  saveButton.style.display = 'inline-block';
}

function hideSaveButton () {
  saveButton.style.display = 'none';
}