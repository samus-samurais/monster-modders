// Import the functions you need from the SDKs you need
const firebase = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile} = require("firebase/auth")
const { doc, setDoc, getFirestore } = require("firebase/firestore");
// require('firebase/auth')
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

require("dotenv").config();
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzDT4WNg-Z_iX2pF1tt6dn6wLz-KU2QI0",
  authDomain: "monster-modders.firebaseapp.com",
  databaseURL: "https://monster-modders-default-rtdb.firebaseio.com",
  projectId: "monster-modders",
  storageBucket: "monster-modders.appspot.com",
  messagingSenderId: "377619460143",
  appId: "1:377619460143:web:6413eb21e95cb1bd8d96da"
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const roomList = require("./rooms");

var loggedInUserInfo = {};

//Defines array of all events in a room that would require listeners
//This lets us iterate through this array to remove said listeners upon room exit
const roomEvents = [
  'updatePlayer',
  'newPlatform',
  'movePlatform',
  'placePlatform',
  'removePlatform',
  'leftLobby',
  'gameStart',
  'readyToBuild',
  'readyToRace',
  'stopTimer',
  'gameOver',
  'disconnect'
];
//roomEvents.forEach((evt) => socket.removeAllListeners(evt));

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('user',socket.id, 'connected');
        // create a new player and add it to our players object

        socket.on("getRoomData", () => {
          socket.emit("roomDataSent", roomList);
        })

        socket.on('joinedRoom', (info) => {
          const currentRoom = roomList[info.roomKey];
          currentRoom.addPlayer(socket, loggedInUserInfo[socket.id]);
          inRoom = true
          socket.join(info.roomKey);
          socket.emit("sentPlayerInfo",currentRoom.players);
          console.log("Room now: ",currentRoom.players);

          socket.to(info.roomKey).emit("newPlayer",currentRoom.getPlayer(socket.id));

          if(!currentRoom.isOpen){
            socket.broadcast.emit("closeRoom",{roomKey: info.roomKey, cause: "Room is full"})
          }

            //Upon recieving a signal that a player has moved, broadcasts emission to update player for all others
          socket.on('updatePlayer', (movementState) => {
            movementState.playerId = socket.id
            currentRoom.updatePlayer(movementState)
            socket.to(info.roomKey).emit('playerMoved', movementState);
          })

          socket.on('newPlatform', (platform) => {
            currentRoom.addPlatform(platform)
            socket.to(info.roomKey).emit("platformAdded",platform);
          })

          socket.on('movePlatform', (platform) => {
            currentRoom.placePlatform(platform)
            socket.to(info.roomKey).emit("platformMoved",platform);
          })

          socket.on('placePlatform', (platform) => {
            currentRoom.placePlatform(platform)
            socket.to(info.roomKey).emit("platformPlaced",platform);
          })

          socket.on('removePlatform', (platform) => {
            currentRoom.removePlatform(platform)
            socket.to(info.roomKey).emit("platformRemoved",platform);
          })

          socket.on('leftLobby', (id) => {
            currentRoom.removePlayer(id)
            //Broadcasts player leaving to all other players if game is in lobby state
            //If game is not in lobby state and this triggers, everyone is leaving anyway, so this not necessary
            if(!currentRoom.gameStarted){
              socket.to(info.roomKey).emit("playerLeft",socket.id);
            }
            socket.broadcast.emit("openRoom",{roomKey: info.roomKey});
            roomEvents.forEach((evt) => socket.removeAllListeners(evt));
            socket.leave(info.roomKey);
          });

          socket.on('gameStart', () => {
            currentRoom.startGame();
            currentRoom.resetGameTimer(); //make sure timers are reset in each room
            currentRoom.resetPlatformTimer();
            const playerInfo = currentRoom.players;
            io.in(info.roomKey).emit('startedGame', playerInfo);
            socket.broadcast.emit("closeRoom",{roomKey: info.roomKey, cause: "Game in progress"})
          })

          socket.on("readyToBuild", () => {
              currentRoom.playersLoaded += 1
              console.log("players loaded is",currentRoom.playersLoaded,"player count is",currentRoom.playerCount);
              if(currentRoom.playersLoaded === currentRoom.playerCount){
                io.in(info.roomKey).emit("updatePlatformTimer", currentRoom.platformTimer);
                currentRoom.timerId = setInterval(() => {
                  console.log("Build timer runs");
                  if(currentRoom.platformTimer > 0) {
                    currentRoom.runPlatformTimer();
                    io.in(info.roomKey).emit("updatePlatformTimer", currentRoom.platformTimer);
                  } else {
                    currentRoom.playersLoaded = 0;
                    console.log("build timer being cleared")
                    io.in(info.roomKey).emit("buildPhaseOver");
                    clearInterval(currentRoom.timerId);
                  }
                }, 1000);
            }
          });

          socket.on("readyToRace", () => {
            currentRoom.playersLoaded += 1
            console.log("players loaded is",currentRoom.playersLoaded,"player count is",currentRoom.playerCount);
            if(currentRoom.playersLoaded === currentRoom.playerCount){
              console.log("Race starting")
              io.in(info.roomKey).emit("updateGameTimer", currentRoom.gameTimer);
              currentRoom.timerId = setInterval(() => {
                console.log("Race timer runs");
                if(currentRoom.gameTimer > 0) {
                  currentRoom.runGameTimer();
                  io.in(info.roomKey).emit("updateGameTimer", currentRoom.gameTimer);
                } else {
                  currentRoom.playersLoaded = 0;
                  console.log("race timer being cleared")
                  clearInterval(currentRoom.timerId);
                }
              }, 1000);
            }
          });

          socket.on('playerLostAllLives', (playerId) => {
            io.in(info.roomKey).emit("disappearedPlayer", playerId);
          })

          socket.on('gameOver', () => {
            currentRoom.endGame();
            io.in(info.roomKey).emit('finishedGame', {cause: "gameOver"});
            socket.broadcast.emit("openRoom",{roomKey: info.roomKey})
            roomEvents.forEach((evt) => socket.removeAllListeners(evt));
            timer = null;
            socket.leave(info.roomKey);
          })

          socket.on('stopTimer', () => {
            if(currentRoom.timerId){
              console.log("Stopping timer");
              clearInterval(currentRoom.timerId);
              currentRoom.timerId = null;
            }
          })

          socket.on('disconnect', () => {
            currentRoom.removePlayer(socket.id)
            if(currentRoom.gameStarted){
              currentRoom.endGame();
              io.in(info.roomKey).emit('finishedGame', {cause: "disconnect"});
            } else {
              socket.to(info.roomKey).emit("playerLeft",socket.id);
            }
            socket.broadcast.emit("openRoom",{roomKey: info.roomKey});
          });
        })

        socket.on('disconnect', () => {
          console.log('user',socket.id, 'disconnected');
          delete loggedInUserInfo[socket.id];
        });

        socket.on("newUserSignup", (input) => {
          createUserWithEmailAndPassword(auth, input.email, input.password)
            .then(() => {
              if (auth.currentUser) {
                // if the new user sign up successfully, update the username as displayName
                updateProfile(auth.currentUser, { displayName: input.username})
                .then(() => {
                  // get the user info
                  const user = auth.currentUser
                  // when user login/singup successfully, the socket.id and the username are bound
                  loggedInUserInfo[socket.id] = user.displayName;

                  // use socket.emit to send the sign up success and the user info
                  socket.emit("signUpSuccess", {
                    username: user.displayName,
                    email: user.email
                  })
                })
              }
            })
            .catch((error) => {
              var errorCode = error.code; // example: auth/email-already-in-use
              var errorMessage = error.message // example: Firebase: Error (auth/email-already-in-use)

              console.log('signup error----', errorCode);
              socket.emit("newUserInfoNotValid", errorCode.slice(5))
            })

        })


        socket.on("userLogin", (input) => {
          signInWithEmailAndPassword(auth, input.email, input.password)
            .then(() => {
              const user = auth.currentUser
              loggedInUserInfo[socket.id] = user.displayName;

              socket.emit("LoginSuccess", {
                username: user.displayName,
                email: user.email
              })
            })
            .catch((error) => {
              var errorCode = error.code; // example: auth/wrong-password
              var errorMessage = error.message // example: FirebaseError: Firebase: Error (auth/wrong-password)

              console.log('login error----', errorCode);
              socket.emit("userInfoNotValid", errorCode.slice(5))
            })
        })
    });
}
