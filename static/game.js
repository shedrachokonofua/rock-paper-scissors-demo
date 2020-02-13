const socket = io();

const play = move => socket.emit('play', move);
const setMessage = message => document.getElementById('message').innerHTML = message;

socket.on('result', setMessage);
socket.on('waiting', () => setMessage("Waiting for other player."));
