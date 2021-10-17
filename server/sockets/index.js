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

var players = {};
var loggedInUser = null;

const addPlayerToSocket = (socket) => {
  players[socket.id] = {
    playerId: socket.id,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50
  };
  if(loggedInUser){
    players[socket.id].username = loggedInUser;
  }
}

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('user',socket.id, 'connected');
        // create a new player and add it to our players object

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
          socket.broadcast.emit('playerMoved',movementState);
        })

        socket.on('gameStart', () => {
          socket.broadcast.emit('startedGame');
        })

        socket.on('disconnect', () => {
          console.log('user',socket.id, 'disconnected');
          //delete player
          socket.broadcast.emit("playerLeft",socket.id);
          delete players[socket.id];
        });

        socket.on("newUserSignup", (input) => {
          createUserWithEmailAndPassword(auth, input.email, input.password)
            .then(() => {
              if (auth.currentUser) {
                // if the new user sign up successfully, update the username as displayName
                // I didn't find out where to create the new column in firebase, so use the property photoURL to store number_of_wins
                updateProfile(auth.currentUser, { displayName: input.username, photoURL: 0 })
                .then(() => {
                  // get the user info
                  const user = auth.currentUser
                  loggedInUser = user.displayName
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
              loggedInUser = user.displayName
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
