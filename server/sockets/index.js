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

var players = {};
var loggedInUserInfo = {};
var platforms = {};


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

          socket.to(info.roomKey).emit("newPlayer",currentRoom.getPlayer(socket.id));
          
          if(!currentRoom.isOpen){
            console.log("Closing full capacity room");
            socket.broadcast.emit("closeRoom",{roomKey: info.roomKey})
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
            socket.to(info.roomKey).emit("playerLeft",socket.id);
            socket.broadcast.emit("openRoom",{roomKey: info.roomKey});
          });

          socket.on('gameStart', () => {
            currentRoom.startGame();
            const playerInfo = currentRoom.players;
            io.in(info.roomKey).emit('startedGame', playerInfo);
            console.log("Game in progress - closing room");
            socket.broadcast.emit("closeRoom",{roomKey: info.roomKey})
          })

          socket.on('gameOver', () => {
            currentRoom.endGame();
            io.in(info.roomKey).emit('finishedGame', {cause: "gameOver"});
            socket.broadcast.emit("openRoom",{roomKey: info.roomKey})
          })

          socket.on('disconnect', () => {
            if(currentRoom.gameStarted){
              currentRoom.endGame();
              io.in(info.roomKey).emit('finishedGame', {cause: "disconnect"});
            } else {
              currentRoom.removePlayer(socket.id)
              socket.to(info.roomKey).emit("playerLeft",socket.id);
              socket.broadcast.emit("openRoom",{roomKey: info.roomKey});
            }
          });
        })

        socket.on('disconnect', () => {
          console.log('user',socket.id, 'disconnected');
          delete loggedInUserInfo[socket.id];
        });
        /*

        //Wait for scene to signal it is ready thorugh "playerJoined" emission
        socket.on('playerJoined', (playerSocket = socket) => {
          addPlayerToSocket(playerSocket);
          socket.emit("sentPlayerInfo",players);
          // send the players object to the new player
          // update all other players of the new player
          socket.broadcast.emit('newPlayer', players[socket.id]);
        })

        //Upon recieving a signal that a player has moved, broadcasts emission to update player for all others
        socket.on('updatePlayer', (movementState) => {
          movementState.playerId = socket.id
          socket.broadcast.emit('playerMoved', movementState);
        })

        socket.on('gameStart', () => {
          for (const key of Object.keys(players)) {
            players[key].x = 200,
            players[key].y = 535
          }
          io.emit('startedGame', players);
        })

        socket.on('newPlatform', (platform) => {
          addPlatformToSocket(platform);
          socket.broadcast.emit("platformAdded",platform);
        })

        socket.on('movePlatform', (platform) => {
          updatePlatform(platform);
          socket.broadcast.emit("platformMoved",platform);
        })

        socket.on('placePlatform', (platform) => {
          socket.broadcast.emit("platformPlaced",platform);
        })

        socket.on('removePlatform', (platform) => {
          socket.broadcast.emit("platformRemoved",platform);
          delete platforms[platform.id];
        })
        */

        socket.on("newUserSignup", (input) => {
          createUserWithEmailAndPassword(auth, input.email, input.password)
            .then(() => {
              if (auth.currentUser) {
                // if the new user sign up successfully, update the username as displayName
                // use the property photoURL to store number_of_wins temporarily
                updateProfile(auth.currentUser, { displayName: input.username, photoURL: 0 })
                .then(() => {
                  // get the user info
                  const user = auth.currentUser
                  // when user login/singup successfully, the socket.id and the username are bound
                  loggedInUserInfo[socket.id] = user.displayName;

                  // use socket.emit to send the sign up success and the user info
                  socket.emit("signUpSuccess", {
                    username: user.displayName,
                    email: user.email,
                    number_of_wins: Number(user.photoURL)
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
                email: user.email,
                number_of_wins: Number(user.photoURL)
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
