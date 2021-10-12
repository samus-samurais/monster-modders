// Import the functions you need from the SDKs you need
const firebase = require("firebase/app");
require('firebase/auth')
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

require("dotenv").config();
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);

var players = {};

const addPlayerToSocket = (socket) => {
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

        socket.on('disconnect', () => {
          console.log('user',socket.id, 'disconnected');
          //delete player
          socket.broadcast.emit("playerLeft",socket.id);
          delete players[socket.id];
        });

        socket.on("newUserSignup", (input) => {
          firebase
          .auth()
          .createUserWithEmailAndPassword(input.email, input.password)
          .then((userCredential) => {
            const user = firebaseApp.auth().currentUser;
            user.updateProfile({ displayName: input.username })
            // const user = userCredential.user
            console.log("...here is the newUser...", user)
            socket.emit("signUpSuccess", user)
          })
          .catch((error) => {
            var errorMessage = error.message;
            console.log('signup error----', errorMessage);
            socket.emit("newUserInfoNotValid", errorMessage)
          })
        })
    });
}
