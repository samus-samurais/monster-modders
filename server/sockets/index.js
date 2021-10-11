var players = {};

module.exports = (io) => {
    io.on('connection', function (socket) {
        console.log('a user connected');
        // create a new player and add it to our players object
        players[socket.id] = {
            playerId: socket.id,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50
        };
        console.log("Current players: ",players);
        // send the players object to the new player
        socket.emit('currentPlayers', players);
        // update all other players of the new player
        socket.broadcast.emit('newPlayer', players[socket.id]);

        socket.on('disconnect', function () {
          console.log('user disconnected');

          //delete player
          delete players[socket.id];
          // emit a message to all players to remove this player
          console.log("Current players: ",players);
        });
      });
}