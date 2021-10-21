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

// Initialize Firebase stuff and room list
const firebaseApp = firebase.initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const roomList = require("./rooms");

//Stores information of all logged in users
const loggedInUserInfo = {};

//Defines array of all events in a room that require listeners
//This lets us iterate through this array to remove said listeners when a player leaves a room
const roomEvents = [
  'updatePlayer',
  'newPlatform',
  'movePlatform',
  'placePlatform',
  'removePlatform',
  'leftLobby',
  'gameStart',
  'gameOver',
  'disconnect'
];

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('user',socket.id, 'connected');

        //Sends the room list to players in RoomSelector for initial room button setup
        socket.on("getRoomData", () => {
          socket.emit("roomDataSent", roomList);
        })

        //Handles everything that goes on in a room
        socket.on('joinedRoom', (info) => {
          const currentRoom = roomList[info.roomKey];
          currentRoom.addPlayer(socket, loggedInUserInfo[socket.id]);
          socket.join(info.roomKey);
          socket.emit("sentPlayerInfo",currentRoom.players);

          //Sends newly joined player info to all players currently in room
          socket.to(info.roomKey).emit("newPlayer",currentRoom.getPlayer(socket.id));
          
          //Closes room if room is now full
          if(!currentRoom.isOpen){
            console.log("Closing full capacity room");
            socket.broadcast.emit("closeRoom",{roomKey: info.roomKey, cause: "Room is full"})
          }
          
          //Upon recieving a signal that a player has moved, broadcasts emission to update player for all others
          socket.on('updatePlayer', (movementState) => {
            movementState.playerId = socket.id
            currentRoom.updatePlayer(movementState)
            socket.to(info.roomKey).emit('playerMoved', movementState);
          })

          //If player adds/changes/places/removes a platform, its information is broadcasted to everyone else
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

          //If a player leaves room during a LobbyScene, their departure is broadcasted and the room is opened up if full
          socket.on('leftLobby', (id) => {
            currentRoom.removePlayer(id)
            socket.to(info.roomKey).emit("playerLeft",socket.id);
            if(!currentRoom.isOpen){
              socket.broadcast.emit("openRoom",{roomKey: info.roomKey});
            }
            roomEvents.forEach((evt) => socket.removeAllListeners(evt));
            socket.leave(info.roomKey);
          });

          socket.on('gameStart', () => {
            currentRoom.startGame();
            const playerInfo = currentRoom.players;
            io.in(info.roomKey).emit('startedGame', playerInfo);
            console.log("Game in progress - closing room");
            socket.broadcast.emit("closeRoom",{roomKey: info.roomKey, cause: "Game in progress"})
          })

          socket.on('gameOver', () => {
            currentRoom.endGame();
            io.in(info.roomKey).emit('finishedGame', {cause: "gameOver"});
            socket.broadcast.emit("openRoom",{roomKey: info.roomKey})
            roomEvents.forEach((evt) => socket.removeAllListeners(evt));
            socket.leave(info.roomKey);
          })

          socket.on('disconnect', () => {
            if(currentRoom.gameStarted){
              currentRoom.endGame();
              io.in(info.roomKey).emit('finishedGame', {cause: "disconnect"});
              socket.broadcast.emit("openRoom",{roomKey: info.roomKey})
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
