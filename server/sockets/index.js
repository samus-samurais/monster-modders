// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} = require("firebase/auth")
const { doc, setDoc, getFirestore, getDoc, collection, getDocs, updateDoc, query, orderBy, limit } = require("firebase/firestore");
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
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);
const roomList = require("./rooms");

var loggedInUserInfo = {};
var gameLeaderboard = [];

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
  'playerLostAllLives',
  'stopTimer',
  'gameOver',
  'playerFinished',
  'playerLeave',
  'displayPoints',
  'displayLeaderboardWithWinner',
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
            currentRoom.playersReady += 1
            console.log("players loaded is",currentRoom.playersReady,"player count is",currentRoom.playerCount);
            if(currentRoom.playersReady === currentRoom.playerCount){
              currentRoom.playersReady = 0;
              io.in(info.roomKey).emit("updatePlatformTimer", currentRoom.platformTimer);
              currentRoom.timerId = setInterval(() => {
                console.log("Build timer runs");
                if(currentRoom.platformTimer > 0) {
                  currentRoom.runPlatformTimer();
                  io.in(info.roomKey).emit("updatePlatformTimer", currentRoom.platformTimer);
                } else {
                  console.log("build timer being cleared")
                  io.in(info.roomKey).emit("buildPhaseOver");
                  clearInterval(currentRoom.timerId);
                }
              }, 1000);
            }
          });

          socket.on("readyToRace", () => {
            currentRoom.playersReady += 1
            console.log("players loaded is",currentRoom.playersReady,"player count is",currentRoom.playerCount);
            if(currentRoom.playersReady === currentRoom.playerCount){
              currentRoom.playersReady = 0;
              console.log("Race starting")
              io.in(info.roomKey).emit("startRace");
              io.in(info.roomKey).emit("updateGameTimer", currentRoom.gameTimer);
              currentRoom.timerId = setInterval(() => {
                console.log("Race timer runs");
                if(currentRoom.gameTimer > 0) {
                  currentRoom.runGameTimer();
                  io.in(info.roomKey).emit("updateGameTimer", currentRoom.gameTimer);
                } else {
                  console.log("race timer being cleared")
                  clearInterval(currentRoom.timerId);
                  io.in(info.roomKey).emit("raceTimeOver", {playerInfo: currentRoom.players, playerCount: currentRoom.playerCount, pointsToWin: currentRoom.pointsToWin});
                }
              }, 1000);
            }
          });

          socket.on("displayPoints", () => {
            currentRoom.playersReady += 1
            console.log("players loaded in pointsScene is",currentRoom.playersReady,"player count is",currentRoom.playerCount);
            if(currentRoom.playersReady === currentRoom.playerCount){
              console.log("Points timer starting")
              currentRoom.playersReady = 0;
              io.in(info.roomKey).emit("updatePointsTimer", currentRoom.pointsTimer);
              currentRoom.timerId = setInterval(() => {
                console.log("Points timer runs");
                if(currentRoom.pointsTimer > 0) {
                  currentRoom.runPointsTimer();
                  io.in(info.roomKey).emit("updatePointsTimer", currentRoom.pointsTimer);
                } else {
                  console.log("points timer being cleared");
                  currentRoom.newRound();
                  clearInterval(currentRoom.timerId);
                  io.in(info.roomKey).emit("pointsSceneOver");
                }
              }, 1000);
            }
          });

          socket.on('playerLostAllLives', (playerId) => {
            socket.to(info.roomKey).emit("disappearedPlayer", playerId);
          })

          socket.on('playerFinished', (playerId) => {
            if(currentRoom.playerFinished(playerId)){
              clearInterval(currentRoom.timerId);
              io.in(info.roomKey).emit('roundOver',{playerInfo: currentRoom.players, playerCount: currentRoom.playerCount, pointsToWin: currentRoom.pointsToWin});
            }
          })

          socket.on('displayLeaderboardWithWinner', async () => {
            // get top of 10 users info order by number of wins in desc in room.
            const topTenUsers = query(collection(db, "users"), orderBy("number_of_wins", "desc"), limit(10));
            const topTenUsersInfo = await getDocs(topTenUsers);
            topTenUsersInfo.forEach(doc => {
              gameLeaderboard.push(doc.data());
            })
            console.log('gameLeaderboard......', gameLeaderboard);
            io.in(info.roomKey).emit('roomLeaderboardInfo', gameLeaderboard);
            gameLeaderboard = [];
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

        socket.on('leaderboard', async () => {
          // get top of 10 users info order by number of wins in desc.
          const topTenUsers = query(collection(db, "users"), orderBy("number_of_wins", "desc"), limit(10));
          const topTenUsersInfo = await getDocs(topTenUsers);
          topTenUsersInfo.forEach(doc => {
            gameLeaderboard.push(doc.data());
          })
          console.log('......gameLeaderboard', gameLeaderboard);
          socket.emit('leaderboardInfo', gameLeaderboard);
          gameLeaderboard = [];
        })

        socket.on('updatePlayerNumOfWins', async (winner) => {
          console.log('winner infor --------', winner);
          if (winner.uid) {
            const userSnap = await getDoc(doc(db, "users", winner.uid));
            const userNumOfWins = userSnap.data().number_of_wins + 1;

            await updateDoc(doc(db, "users", winner.uid), {
              number_of_wins: userNumOfWins
            })
          }
        })

        socket.on("newUserSignup", (input) => {
          createUserWithEmailAndPassword(auth, input.email, input.password)
            .then(async () => {
              if (auth.currentUser) {
                // create the user in firestore by same uid;
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                  username: input.username,
                  number_of_wins: 0
                })

                // store the uid and username in loggedInUserInfo by socket.io
                loggedInUserInfo[socket.id] = {
                  uid: auth.currentUser.uid,
                  username: input.username
                }
                // use socket.emit to send the sign up success and the user info
                socket.emit("signUpSuccess", {
                  username: input.username,
                  email: auth.currentUser.email,
                  number_of_wins: 0
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
            .then(async () => {
              // get the login user info
              const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
              const loginUser = userSnap.data();

              loggedInUserInfo[socket.id] = {
                uid: auth.currentUser.uid,
                username: loginUser.username
              }

              socket.emit("LoginSuccess", {
                username: loginUser.username,
                email: input.email,
                number_of_wins: loginUser.number_of_wins
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
