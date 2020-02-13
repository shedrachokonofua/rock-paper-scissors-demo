const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const PORT = 8082;

// Start Server
server.listen(PORT, () => {
  console.log(`Running server on port ${PORT}`)
});

app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
});

// WebSocket handlers
let playQueue = [];

io.on('connection', socket => {
  socket.on('play', move => {
    if(playQueue.length == 0) {
      playQueue.push({pid: socket.id, move});
      socket.emit("waiting");
    } else {
      const play1 = playQueue[0];
      const play2 = {pid: socket.id, move};
      playQueue = [];
      const winningPlay = getWinningPlay(play1, play2);

      if(!winningPlay) {
        io.to(`${play1.pid}`).emit('result', 'Tie!');
        io.to(`${play2.pid}`).emit('result', 'Tie!');
      }
      else if(winningPlay.pid === play1.pid) {
        emitResults(play1, play2);
      }
      else {
        emitResults(play2, play1);
      }
    }
  });
});

const emitResults = (winningPlay, losingPlay) => {
  const makeReport = (move1, move2) => `You played ${move1}, opponent played ${move2}.`;
  io.to(`${winningPlay.pid}`)
    .emit('result', "YOU WIN! "+makeReport(winningPlay.move, losingPlay.move));
  
  io.to(`${losingPlay.pid}`)
    .emit('result', "YOU LOSE :( "+makeReport(losingPlay.move, winningPlay.move));
}

function getWinningPlay(play1, play2) {
  if(play1.move == play2.move) return null;

  const beats = (winMove, loseMove) =>
    (move1, move2) => move1 === winMove && move2 === loseMove;

  const paperBeatsRock = beats("paper", "rock");
  const rockBeatsScissors = beats("rock", "scissors");
  const scissorsBeatsPaper = beats("scissors", "paper");

  if(
    paperBeatsRock(play1.move, play2.move) ||
    rockBeatsScissors(play1.move, play2.move) ||
    scissorsBeatsPaper(play1.move, play2.move)
  ) {
    return play1;
  }

  return play2;
}