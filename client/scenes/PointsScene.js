import Phaser from "phaser"
import Player from "../sprites/Player";

export default class PointsScene extends Phaser.Scene {
  constructor() {
    super('PointsScene');
    this.player = null
    this.otherPlayers = {}
    this.otherPlayerPointsText = {}
    this.otherLeaveRoomButtons = {}
    this.gameTimer = null;
    this.pointsTimer = null;
    this.leaveRoomButton = null;
    this.winnerStatus = false;
    this.winnerId = null;
    this.playerOrdered = null;
    this.leaderboardInfo = null;
    this.pointsTimer = null;
  }

  init(data) {
    this.socket = data.socket;
    this.playerId = data.socket.id;
    this.playerInfo = data.user ? data.user : null;
    this.players = data.players;
    this.pointsInfo = data.pointsInfo;
    console.log("here is the points info...........", this.pointsInfo);
    console.log("here is the players keys...........", Object.keys(this.players));
  }

  create() {
    const self = this;
    this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);

    this.add.text(550, 45, `To Win:     ${this.pointsInfo.pointsToWin} points`, { color: 'white', fontFamily: 'Arial', fontSize: '30px '});

    let ids = Object.keys(this.players)
    for(let j = 0; j < ids.length; j++){
      if (this.pointsInfo.playerInfo[ids[j]].points >= this.pointsInfo.pointsToWin) {
        this.winnerStatus = true;
        this.socket.emit('leaderboard');
        this.orderPlayers();
        return;
      }
      if (j === ids.length - 1 && !this.winnerStatus) {
        this.socket.emit("displayPoints");
      }
    }

    for(let i = 0; i < ids.length; i++){
        let yPosition = this.winnerStatus ? this.playerOrdered.indexOf(this.pointsInfo.playerInfo[ids[i]]) : (this.pointsInfo.playerInfo[ids[i]].placedThisRound ? this.pointsInfo.playerInfo[ids[i]].placedThisRound - 1 : this.pointsInfo.playerCount - 1)
        if(ids[i] === this.playerId){
            this.playerPointsText = this.add.text(700, yPosition * 144 + 130, `${this.pointsInfo.playerInfo[ids[i]].points} points`, { color: 'purple', fontFamily: 'Arial', fontSize: '26px ', align: 'center'});

            this.player = new Player(this, 600, yPosition * 144 + 144, 'dude', 'PC', this.socket, this.players[ids[i]].username)

            // if there is a winner player, then show the leaveRoomButton
            if (this.winnerStatus) {
              this.leaveRoomButton = this.add.image(980, yPosition * 144 + 144, 'leaveRoomButton').setInteractive();
              this.leaveRoomButton.on('pointerdown', () => {
                this.socket.emit('playerLeave', this.playerId);
                this.scene.stop("PointsScene");
                this.scene.launch("HomeScene", { socket: this.socket, user: this.playerInfo })
              });
            }

        } else {
            this.otherPlayerPointsText[ids[i]] = this.add.text(700, yPosition * 144 + 130, `${this.pointsInfo.playerInfo[ids[i]].points} points`, { color: 'purple', fontFamily: 'Arial', fontSize: '26px ', align: 'center'});

            this.otherPlayers[ids[i]] = new Player(this, 600, yPosition * 144 + 144, 'dude','NPC', null, this.players[ids[i]].username);

            if (this.winnerStatus) {
              this.otherLeaveRoomButtons[ids[i]] = this.add.image(980, yPosition * 144 + 144, 'leaveRoomButton')
            }

        }
    }

    // if there is no winner player info, we create a timer to count 5 seconds to show the points scene.
    //points timer text initially rendered as "Players loading" until all players are ready
    this.pointsTimer = this.add.text(150, 300, "points loading...", {fontSize: 30});

    //Socket stuff is below

    this.socket.on('leaderboardInfo', (leaderboardArr) => {
      this.leaderboardInfo = leaderboardArr;
      this.leaderboard();
    })

    this.socket.on('playerLeaveGameRoom', (playerId, scene = self) => {
      scene.playerLeave(playerId);
    })

    this.socket.on("updatePointsTimer", (time) => {
      console.log("points timer updated-----");
      this.pointsTimer.setText(`${time}`);
      if(time === 0) {
        this.timesUp();
      }
    })

    this.socket.on('finishedGame', function(info, scene = self){
      if(info.cause === "disconnect"){
        scene.handleDisconnect();
      }
      scene.closeGame();
    })

  }

  update () {
    if (this.player) {
      this.player.body.moves = false;
      this.player.body.allowGravity = false;
    }
  }

  orderPlayers() {
    if (this.winnerStatus) {
      this.playerOrdered = Object
        .keys(this.players)
        .map((id) => {
          return this.pointsInfo.playerInfo[id];
        })
        .sort((playerA, playerB) => {
          if ((playerA.points - playerB.points) < 0) return 1;
          if ((playerA.points - playerB.points) > 0) return -1;
          if ((playerA.points - playerB.points) === 0) {
            if (playerA.placedThisRound < playerB.placedThisRound) return -1;
            else return 1;
          }

        })
      console.log('....this.playerOrdered....', this.playerOrdered)

      this.winnerId = this.playerOrdered[0].playerId
      this.socket.emit('updatePlayerNumOfWins', this.playerOrdered[0]);
      // if (this.winnerId === this.playerId ) {
      //   this.add.text(200, (this.pointsInfo.playerInfo[ids[i]].placedThisRound ? this.pointsInfo.playerInfo[ids[i]].placedThisRound - 1 : this.pointsInfo.playerCount - 1) * 144 + 130, `Congratulations, you're the WINNER!`, { color: 'purple', fontFamily: 'Arial', fontSize: '26px ', align: 'center'})
      // } else {
      //   this.add.text(200, (this.pointsInfo.playerInfo[ids[i]].placedThisRound ? this.pointsInfo.playerInfo[ids[i]].placedThisRound - 1 : this.pointsInfo.playerCount - 1) * 144 + 130, `Sorry, you lose the game...`, { color: 'purple', fontFamily: 'Arial', fontSize: '26px ', align: 'center'})
      // }
    }
  }

  leaderboard() {
    if (this.leaderboardInfo && this.winnerStatus) {
      this.rectangleBackground = this.add.rectangle(215, 360, 380, 680, 0x009AA8);
      this.add.text(80, 50, `PLAYER LEADERBOARD`, { color: 'white', fontFamily: 'Arial', fontSize: '26px '});
      this.add.text(140, 90, `Player Username`, { color: 'purple', fontFamily: 'Arial', fontSize: '18px '});
      this.add.text(310, 90, `Wins`, { color: 'purple', fontFamily: 'Arial', fontSize: '18px '});
      // display top 10 users' information
      for (let i=0; i < this.leaderboardInfo.length; i++) {
        if (i <= 2) {
          this.add.image(90, i * 55 + 155, `top${i + 1}`)
        }
        this.add.text(140, i * 55 + 130, `${this.leaderboardInfo[i].username}`, { color: 'purple', fontFamily: 'Arial', fontSize: '26px '});
        this.add.text(320, i * 55 + 130, `${this.leaderboardInfo[i].number_of_wins}`, { color: 'purple', fontFamily: 'Arial', fontSize: '26px '});
      }
    }
  }

  playerLeave(id){
    if (this.playerId === id) {
      this.player = null;
      this.scene.launch("HomeScene", { socket: this.socket, user: this.playerInfo })
      if (Object.keys(this.otherPlayers).length === 0) {
        this.socket.emit('gameOver');
      }
    }
    if (this.otherPlayers[id]) {
      console.log("other player leaves with button id:----",this.otherLeaveRoomButtons)
      this.otherLeaveRoomButtons[id].setTint(0xff0000);
      this.otherPlayers[id].delete();
      delete this.otherPlayers[id];
      if (Object.keys(this.otherPlayers).length === 0 && !this.player) {
        this.socket.emit('gameOver');
      }
    }

  }

  handleDisconnect(){
    //TODO: Send a message informing the player that the game has quit due to disconnect
    console.log("Stopping timer");
    this.socket.emit("stopTimer");
  }

  closeGame(){
    console.log("Game is over");
    this.socket.removeAllListeners();
    //Sends a "leftLobby" signal to socket index to make sure player's socket listeners are closed on both ends.
    this.socket.emit('leftLobby', this.playerId);
    // this.scene.start("HomeScene", {socket: this.socket, user: this.playerInfo});
  }

  timesUp() {
    this.pointsTimer.destroy();
    const { width, height } = this.scale;
    this.text = this.add
      .text(width * 0.5, height * 0.5, "Go!", { fontSize: 50 })
      .setOrigin(0.5);
    this.scene.stop("PointsScene");
    this.scene.start("GameScene", {socket: this.socket, user: this.playerInfo, players: this.players});
  }

}