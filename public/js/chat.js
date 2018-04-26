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

socket.on('typing output', function(msg) {
  typing.innerHTML = msg;
});   

socket.on('clear typing', function() {
  typing.innerHTML = "";
});   


socket.on('welcome message', function(msg) {
  messages.innerHTML += '<li id="welcome">' + msg + '</li>';
});

function addChatMessage(message, nickname) {
  messages.innerHTML += "<li>" + nickname + ": " + message + "</li>";
}