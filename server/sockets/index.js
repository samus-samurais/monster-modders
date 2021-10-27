//The motherlode. The big one. The bane of 3 weeks' worth of my existence.
//This handles our sockets for multiplayer functionality, and our Firestore database for user account info
//Anytime a socket emits something that is not already in here, it comes here. And usually breaks until I tell it not to.
//Truly a desolate land, full of hardship. 

// Imports the functions we need from the SDKs we need
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} = require("firebase/auth")
const { doc, setDoc, getFirestore, getDoc, collection, getDocs, updateDoc, query, orderBy, limit } = require("firebase/firestore");


require("dotenv").config();
// The web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzDT4WNg-Z_iX2pF1tt6dn6wLz-KU2QI0",
  authDomain: "monster-modders.firebaseapp.com",
  databaseURL: "https://monster-modders-default-rtdb.firebaseio.com",
  projectId: "monster-modders",
  storageBucket: "monster-modders.appspot.com",
  messagingSenderId: "377619460143",
  appId: "1:377619460143:web:6413eb21e95cb1bd8d96da"
};

// Initializes Firebase and Firestore
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
  'updatePlayerNumOfWins',
  'disconnect'
];
//(If I come back to this: I HATE this. I hate tracking this. There has *got* to be a better way of doing this.)
//(If there is another way, you must find it, for the sake of your future sanity)

module.exports = (io) => {
    io.on('connection', (socket) => {
        //Triggers when a room is joined, handles everything to do with gameplay inside it
        socket.on('joinedRoom', (info) => {
          const currentRoom = roomList[info.roomKey];
          currentRoom.addPlayer(socket, loggedInUserInfo[socket.id]);
          inRoom = true
          socket.join(info.roomKey);
          //Sends room info to newly joined player
          socket.emit("sentPlayerInfo",currentRoom.players);
          //Broadcasts info to other players in room
          socket.to(info.roomKey).emit("newPlayer",currentRoom.getPlayer(socket.id));

          //Closes room if newly joined player has filled it up
          if(!currentRoom.isOpen){
            socket.broadcast.emit("closeRoom",{roomKey: info.roomKey, cause: "Room is full"})
          }

          //Upon recieving a signal that a player has moved, broadcasts emission to update player for all others
          socket.on('updatePlayer', (movementState) => {
            movementState.playerId = socket.id
            currentRoom.updatePlayer(movementState)
            socket.to(info.roomKey).emit('playerMoved', movementState);
          })

          //Fields all platform data. See GameScene for more info on these
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

          //Handles the player leaving a room, either via leaving in the lobby or leaving automatically after a finished game
          //Both situations trigger this, don't be fooled by the slight inaccuracy of the 'leftLobby' moniker
          socket.on('leftLobby', (id) => {
            currentRoom.removePlayer(id)
            //Broadcasts player leaving to all other players if game is in lobby state
            //If game is not in lobby state and this triggers, everyone is leaving anyway, so this not necessary
            if(!currentRoom.gameStarted){
              socket.to(info.roomKey).emit("playerLeft",socket.id);
            }
            //Whatever the reason for players leaving, the room can open again, so this triggers
            socket.broadcast.emit("openRoom",{roomKey: info.roomKey});
            //Closes all socket listeners set up by this room. Trust me, you do *not* want duplicates of these.
            //The errors will be numerous, inconsistent, and generally soul-destroying...
            roomEvents.forEach((evt) => socket.removeAllListeners(evt));
            //Leaves room
            socket.leave(info.roomKey);
          });

          //Triggered when a user pressed the game start button in the lobby scene
          socket.on('gameStart', () => {
            currentRoom.startGame();
            currentRoom.resetGameTimers(); //make sure timers are reset in each room
            const playerInfo = currentRoom.players;
            //Starts the game for everyone!
            io.in(info.roomKey).emit('startedGame', playerInfo);
            socket.broadcast.emit("closeRoom",{roomKey: info.roomKey, cause: "Game in progress"})
          })

          //Recieves a signal denoting that a single player's build scene is loaded and/or ready
          socket.on("readyToBuild", () => {
            currentRoom.playersReady += 1
            //If all of the players are loaded and/or ready, build phase can begin
            if(currentRoom.playersReady === currentRoom.playerCount){
              //Resets counter for future phases
              currentRoom.playersReady = 0;
              //Initial emission is to set up timer UI before timer runs in earnest
              io.in(info.roomKey).emit("updatePlatformTimer", currentRoom.platformTimer);
              currentRoom.timerId = setInterval(() => {
                //Ticks down timer, or emits that timer has run out
                if(currentRoom.platformTimer > 0) {
                  currentRoom.runPlatformTimer();
                  io.in(info.roomKey).emit("updatePlatformTimer", currentRoom.platformTimer);
                } else {
                  io.in(info.roomKey).emit("buildPhaseOver");
                  //Stops timer
                  clearInterval(currentRoom.timerId);
                }
              }, 1000);
            }
          });

          //Recieves a signal denoting that a single player is ready to start racing
          socket.on("readyToRace", () => {
            currentRoom.playersReady += 1
            //If all of the players are loaded and/or ready, race phase can begin
            if(currentRoom.playersReady === currentRoom.playerCount){
              //Resets counter for future phases
              currentRoom.playersReady = 0;
              io.in(info.roomKey).emit("startRace");
              //Initial emission is to set up timer UI before timer runs in earnest
              io.in(info.roomKey).emit("updateGameTimer", currentRoom.gameTimer);
              currentRoom.timerId = setInterval(() => {
                if(currentRoom.gameTimer > 0) {
                  //Ticks down timer, or emits that timer has run out
                  currentRoom.runGameTimer();
                  io.in(info.roomKey).emit("updateGameTimer", currentRoom.gameTimer);
                } else {
                  //Stops timer
                  clearInterval(currentRoom.timerId);
                  io.in(info.roomKey).emit("raceTimeOver", {playerInfo: currentRoom.players, playerCount: currentRoom.playerCount, pointsToWin: currentRoom.pointsToWin});
                }
              }, 1000);
            }
          });


          //Despite the name, this only handles the points scene timer
          //Functionality mirrors the past two listeners so I ain't commenting this one >:T
          socket.on("displayPoints", () => {
            currentRoom.playersReady += 1
            if(currentRoom.playersReady === currentRoom.playerCount){
              currentRoom.playersReady = 0;
              io.in(info.roomKey).emit("updatePointsTimer", currentRoom.pointsTimer);
              currentRoom.timerId = setInterval(() => {
                if(currentRoom.pointsTimer > 0) {
                  currentRoom.runPointsTimer();
                  io.in(info.roomKey).emit("updatePointsTimer", currentRoom.pointsTimer);
                } else {
                  currentRoom.newRound();
                  clearInterval(currentRoom.timerId);
                  io.in(info.roomKey).emit("pointsSceneOver");
                }
              }, 1000);
            }
          });

          //Triggers when a player is kil. no.
          socket.on('playerLostAllLives', (playerId) => {
            socket.to(info.roomKey).emit("disappearedPlayer", playerId);
          })

          //Triggers when a player reaches the finishline
          socket.on('playerFinished', (playerId) => {
            //currentRoom.playerFinished both updates room info accordingly and returns "true" if all players have finished. Hence the following lines of code
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
            io.in(info.roomKey).emit('roomLeaderboardInfo', gameLeaderboard);
            gameLeaderboard = [];
          })


          //Updates Firestore database when a logged in user wins
          socket.on('updatePlayerNumOfWins', async (winner) => {
            if (winner.uid) {
              const userSnap = await getDoc(doc(db, "users", winner.uid));
              const userNumOfWins = userSnap.data().number_of_wins + 1;

              await updateDoc(doc(db, "users", winner.uid), {
                number_of_wins: userNumOfWins
              })
            }
            io.in(info.roomKey).emit("leaderboardReadyForDisplay");
          })

          //Signal that generically ends a game. 
          //I don't think this is in use, which is good because it would cause SO MANY ERRORS
          //Still not touching it though. It might be important. Will check later. 
          socket.on('gameOver', () => {
            currentRoom.endGame();
            socket.broadcast.emit("openRoom",{roomKey: info.roomKey})
            timer = null;
          })

          //Stops timer in the event that a game is quit whilst a timer is running
          socket.on('stopTimer', () => {
            if(currentRoom.timerId){
              clearInterval(currentRoom.timerId);
              currentRoom.timerId = null;
            }
          })

          //Upon a player disconnecting, quits the game for everybody
          //I did not want to handle letting players reconnect or having a game continue without them
          //so this is easier! For now, anyway
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
          delete loggedInUserInfo[socket.id];
        });

        //Sends room data to players in RoomSelector scene
        socket.on("getRoomData", () => {
          const toSend = {}
          for(let i = 1; i <= 9; i++){
            const gameRoom = roomList[`room${i}`];
            toSend[`room${i}`] = {}
            toSend[`room${i}`].isOpen = roomList[`room${i}`].isOpen;
            toSend[`room${i}`].gameStarted = roomList[`room${i}`].gameStarted;
        }
          socket.emit("roomDataSent", toSend);
        })

        socket.on('leaderboard', async () => {
          // get top of 10 users info order by number of wins in desc.
          const topTenUsers = query(collection(db, "users"), orderBy("number_of_wins", "desc"), limit(10));
          const topTenUsersInfo = await getDocs(topTenUsers);
          topTenUsersInfo.forEach(doc => {
            gameLeaderboard.push(doc.data());
          })
          socket.emit('leaderboardInfo', gameLeaderboard);
          gameLeaderboard = [];
        })

        //Updates Firebase and Firestore when new account is created
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
              socket.emit("newUserInfoNotValid", errorCode.slice(5))
            })

        })

        //Fetches user information from Firestore when user logs in successfully
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
              socket.emit("userInfoNotValid", errorCode.slice(5))
            })
        })

    });
}
