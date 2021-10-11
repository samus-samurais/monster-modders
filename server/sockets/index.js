var players = {};

const addPlayerToSocket = (x,y,socket) => {
  players[socket.id] = {
    playerId: socket.id,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50
  };
}

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('user',socket.id, 'connected');
        // create a new player and add it to our players object
        socket.on('playerJoined', (x,y,playerSocket = socket) => {
          console.log("playerJoined caught");
          addPlayerToSocket(x,y,playerSocket);
        socket.emit("sentPlayerInfo",players);
        // send the players object to the new player
        // update all other players of the new player
        socket.broadcast.emit('newPlayer', players[socket.id]);
        })
        socket.on('disconnect', function () {
          console.log('user',socket.id, 'disconnected');
          //delete player
          delete players[socket.id];
          // emit a message to all players to remove this player
        });
      });
}