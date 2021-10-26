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
    this.pointsEvents = ['leaderboardInfo',"updatePointsTimer","pointsSceneOver", "leaderboardReadyForDisplay"];
    this.canControlPlayer = false;

  }

  init(data) {
    this.gameScene = data.gameScene;
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
    this.recDisplayBackground = this.add.rectangle(680, 360, 480, 680, 0x009AA8);
    this.add.text(550, 45, `To Win: ${this.pointsInfo.pointsToWin} points`, { color: 'white', fontSize: '30px '});
    let winner = null;
    let ids = Object.keys(this.players)
    for(let j = 0; j < ids.length; j++){
      if (this.pointsInfo.playerInfo[ids[j]].points >= this.pointsInfo.pointsToWin) {
        console.log("Somebody won with",this.pointsInfo.playerInfo[ids[j]].points,"points, points to win is",this.pointsInfo.pointsToWin);
        this.winnerStatus = true;
        this.winnerId = ids[j];
        winner = this.pointsInfo.playerInfo[ids[j]]
        break;
      }
    }

    for(let i = 0; i < ids.length; i++){
        if(ids[i] === this.playerId){
            this.playerPointsText = this.add.text(700, i * 100 + 120, `${this.pointsInfo.playerInfo[ids[i]].points} points`, { color: 'white',fontSize: '26px'});

            this.player = new Player(this, 610, i * 100 + 144, 'zombiesprite', 'PC', this.socket, this.players[ids[i]].username)

        } else {
            this.otherPlayerPointsText[ids[i]] = this.add.text(700, i * 100 + 120, `${this.pointsInfo.playerInfo[ids[i]].points} points`, { color: 'white', fontSize: '26px ', align: 'center'});

            this.otherPlayers[ids[i]] = new Player(this, 610, i * 100 + 144, 'zombiesprite','NPC', null, this.players[ids[i]].username);

        }
    }

    // if there is no winner player info, we create a timer to count 5 seconds to show the points scene.
    //points timer text initially rendered as "Players loading" until all players are ready
    this.pointsTimer = this.add.text(680, 510, "", { color: '#ffc93c', fontSize: 40 });

    //Socket stuff is below

    this.socket.on('roomLeaderboardInfo', (leaderboardArr) => {
      this.leaderboardInfo = leaderboardArr;
      this.orderPlayers();
      this.leaderboard();
    })

    this.socket.on("updatePointsTimer", (time) => {
      this.pointsTimer.setText(`${time}`);
    })

    this.socket.on("pointsSceneOver", () => {
      this.timesUp();
    })

    this.socket.on("leaderboardReadyForDisplay", () => {
      this.socket.emit('displayLeaderboardWithWinner');
    })

    this.socket.on('finishedGame', (info, scene = self) => {
      if(info.cause === "disconnect"){
        scene.handleDisconnect();
      }
      scene.closeGame();
    })

    this.socket.emit("displayPoints");
    if(this.winnerId === this.playerId){
      this.socket.emit('updatePlayerNumOfWins', winner);
    }

  }

  update () {
    if (this.player) {
      this.player.body.moves = false;
      this.player.body.allowGravity = false;
    }
  }

  orderPlayers() {
    if (this.winnerStatus && !this.playerOrdered) {
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
      if (this.winnerId === this.playerId ) {
        this.add.text(this.player.x - 100, this.player.y - 24, `WIN`, { color: '#ffc93c', fontSize: '26px'})
        this.add.text(500, 600, `Congratulation, you WIN!`, { color: '#ffc93c', fontSize: '26px'})
      } else {
        this.add.text(480, 600, `Sorry, you lose the game...`, { color: '#ffc93c', fontSize: '26px'})
      }
    }
  }

  leaderboard() {
    if (this.leaderboardInfo && this.winnerStatus) {
      this.rectangleBackground = this.add.rectangle(215, 360, 380, 680, 0x009AA8);
      this.add.text(80, 50, `PLAYER LEADERBOARD`, { color: 'white', fontSize: '26px '});
      this.add.text(110, 90, `Player Username`, { color: 'purple', fontSize: '18px '});
      this.add.text(310, 90, `Wins`, { color: 'purple', fontSize: '18px '});
      // display top 10 users' information
      for (let i=0; i < this.leaderboardInfo.length; i++) {
        if (i <= 2) {
          this.add.image(90, i * 55 + 155, `top${i + 1}`)
        }
        this.add.text(140, i * 55 + 130, `${this.leaderboardInfo[i].username}`, { color: 'purple', fontSize: '26px'});
        this.add.text(320, i * 55 + 130, `${this.leaderboardInfo[i].number_of_wins}`, { color: 'purple', fontSize: '26px'});
      }
    }
  }

  handleDisconnect(){
    console.log("Stopping timer");
    this.socket.emit("stopTimer");
  }

  closeGame(){
    this.pointsEvents.forEach((evt) => this.socket.removeAllListeners(evt));
    this.scene.stop("PointsScene");
  }

  timesUp() {
    console.log("Stopping points scene");
    this.pointsTimer.destroy();
    if (!this.winnerStatus) {
      this.gameScene.newRound();
      this.pointsEvents.forEach((evt) => this.socket.removeAllListeners(evt));
      this.scene.stop("PointsScene");
    } else {
      console.log("there is a winner.........");
      this.socket.emit("gameOver");
      this.gameScene.closeGame();
    }
  }

}
