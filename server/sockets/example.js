const { Room, gameRooms, staticRooms } = require('./room');

// code generator for custom room
const roomCodeGenerator = () => {
  let code = '';
  let chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// define socket functionality on server side
module.exports = (io) => {
  io.on('connection', function (socket) {
    // send back current static rooms status
    socket.on('checkStaticRooms', () => {
      socket.emit('staticRoomStatus', staticRooms);
    });

    // player could create a custom room
    socket.on('createRoom', () => {
      let code = roomCodeGenerator();
      while (Object.keys(gameRooms).includes(code)) {
        code = roomCodeGenerator();
      }
      gameRooms[code] = new Room();
      socket.emit('roomCreated', code);
    });

    // player joins a room with room key
    socket.on('joinRoom', ({ roomKey, spriteKey, username }) => {
      if (Object.keys(gameRooms).includes(roomKey)) {
        const roomInfo = gameRooms[roomKey];
        if (roomInfo.checkRoomStatus()) {
          if (roomInfo.playerNum < 16) {
            socket.join(roomKey);

            // update players info of the room player joined
            roomInfo.addNewPlayer(socket.id, spriteKey, username);

            // send all info of that room to player
            socket.emit('roomInfo', { roomInfo, roomKey });

            // send player info to other players in that room
            socket.to(roomKey).emit('newPlayerJoined', {
              playerId: socket.id,
              playerInfo: roomInfo.players[socket.id],
            });

            // countdown for starting game in the waiting room
            socket.on('startTimer', () => {
              const countdownInterval = setInterval(() => {
                if (roomInfo.countdown > 0) {
                  io.in(roomKey).emit('timerUpdated', roomInfo.countdown);
                  roomInfo.runTimer();
                } else {
                  roomInfo.closeRoom();
                  io.emit('updatedRooms', staticRooms);
                  io.in(roomKey).emit('loadNextStage', roomInfo);
                  clearInterval(countdownInterval);
                }
              }, 1000);
            });

            // keep track of how many players been loaded in the stage
            socket.on('stageLoaded', () => {
              roomInfo.updateLoadedPlayerNum();

              // start timer after all players been loaded in the stage
              if (roomInfo.playerNum === roomInfo.playersLoaded) {
                const stageInterval = setInterval(() => {
                  if (roomInfo.stageTimer > 0) {
                    io.in(roomKey).emit(
                      'stageTimerUpdated',
                      roomInfo.stageTimer
                    );
                    roomInfo.runStageTimer();
                  } else {
                    io.in(roomKey).emit('startStage');
                    clearInterval(stageInterval);
                  }
                }, 1000);
              }
            });

            // send player movement to other players in that room
            socket.on('updatePlayer', (moveState) => {
              socket.to(roomKey).emit('playerMoved', {
                playerId: socket.id,
                moveState,
              });
            });

            // update winner list when opponents pass the stage
            socket.on('passStage', (stageKey) => {
              // only update winner list if the stage hasn't reached limit
              if (!roomInfo.reachStageLimit(stageKey)) {
                roomInfo.updateWinnerList(socket.id);
                io.in(roomKey).emit('updateWinners', roomInfo.winnerNum);
              }

              // end the stage if num of winners reach the stage limit
              if (roomInfo.reachStageLimit(stageKey)) {
                roomInfo.resetStageStatus();
                roomInfo.updatePlayerList();
                io.in(roomKey).emit('stageEnded', roomInfo);
                roomInfo.resetWinnerList();
              }
            });

            // randomizes stage order in roomInfo
            socket.on('randomize', () => {
              roomInfo.randomizeStages();
            });

            // player leave the waiting room / any stages, or when they lost the stage, or when all stages ended
            socket.on('leaveGame', () => {
              // stop all listeners in the current room for the player
              const allEvents = [
                'startTimer',
                'stageLoaded',
                'updatePlayer',
                'passStage',
                'randomize',
                'leaveGame',
                'disconnecting',
              ];
              allEvents.forEach((evt) => socket.removeAllListeners(evt));

              // player leave the room
              socket.leave(roomKey);

              // remove player from player list of the room
              roomInfo.removePlayer(socket.id);

              // reopen room when no players left in the room
              if (roomInfo.playerNum === 0) {
                if (roomKey.length === 4) {
                  delete gameRooms[roomKey];
                }
                roomInfo.openRoom();
                io.emit('updatedRooms', staticRooms);
              }

              // inform other players in that room
              socket.to(roomKey).emit('playerLeft', {
                playerId: socket.id,
              });

              // let player go back to lobby scene after leaving the room
              socket.emit('gameLeft');
            });

            // remove player from room info when player leaves the room (refresh/close the page)
            socket.on('disconnecting', () => {
              roomInfo.removePlayer(socket.id);

              // reopen room where no players left in room
              if (roomInfo.playerNum === 0) {
                if (roomKey.length === 4) {
                  delete gameRooms[roomKey];
                }
                roomInfo.openRoom();
                io.emit('updatedRooms', staticRooms);
              } else {
                // if a player leaves a lobby where players are loaded into a stage, decrease the amount of players loaded
                if (roomInfo.playersLoaded > 0) {
                  roomInfo.playersLoaded -= 1;
                }

                // update stage limits & winner list for other players in the room
                roomInfo.countStageLimits();
                roomInfo.removeWinner(socket.id);

                // inform other players in that room with updated stage limit
                socket.to(roomKey).emit('playerLeft', {
                  playerId: socket.id,
                  newStageLimits: roomInfo.stageLimits,
                  winnerNum: roomInfo.winnerNum,
                });

                // end the stage if num of winners reach the stage limit
                if (
                  roomInfo.reachStageLimit(roomInfo.stages[roomInfo.stageIdx])
                ) {
                  roomInfo.resetStageStatus();
                  roomInfo.updatePlayerList();
                  io.in(roomKey).emit('stageEnded', roomInfo);
                  roomInfo.resetWinnerList();
                }
              }
            });
          } else {
            socket.emit('roomFull');
          }
        } else {
          socket.emit('roomClosed');
        }
      } else {
        socket.emit('roomDoesNotExist');
      }
    });
  });
};