import Phaser from "phaser"
import Player from "../sprites/Player";

export default class PointsScene extends Phaser.Scene {
  constructor() {
    super('PointsScene');
    this.pointsEvents = ['leaderboardInfo',"updatePointsTimer","pointsSceneOver", "leaderboardReadyForDisplay"];
  }

  init(data) {
    this.gameScene = data.gameScene;
    this.socket = data.socket;
    this.playerId = data.socket.id;
    this.playerInfo = data.user ? data.user : null;
    this.players = data.players;
    this.pointsInfo = data.pointsInfo;

    //Resets all important data
    this.player = null
    this.otherPlayers = {}
    this.otherPlayerPointsText = {}
    this.otherLeaveRoomButtons = {}
    this.gameTimer = null;
    this.pointsTimer = null;
    this.timerText = "";
    this.playerOrdered = null;
    this.leaderboardInfo = null;
    this.winners = []
    this.winnerStatus = false;
    this.winnerId = null;
  }

  create() {
    //Initially hides scene, displaying round over text while scene loads
    this.scene.sendToBack("PointsScene");
    const self = this;
    this.recDisplayBackground = this.add.rectangle(680, 360, 480, 680, 0x009AA8);
    this.add.text(550, 45, `To Win: ${this.pointsInfo.pointsToWin} points`, { color: 'white', fontSize: '30px '});
    let winner = null;
    let ids = Object.keys(this.players)
    for(let j = 0; j < ids.length; j++){
      if (this.pointsInfo.playerInfo[ids[j]].points >= this.pointsInfo.pointsToWin) {
        this.winnerStatus = true;
        //this.winnerId = ids[j];
        //winner = this.pointsInfo.playerInfo[ids[j]]
        this.pointsInfo.playerInfo[ids[j]].id = ids[j];
        this.winners.push(this.pointsInfo.playerInfo[ids[j]]);
      }
    }
    
    /*
        console.log(
          `${roundData.playerInfo[key].username} ${this.placementStatuses[roundData.playerInfo[key].placedThisRound]}
          ${(roundData.playerInfo[key].placedThisRound > 0 ?
            `+${roundData.playerCount+1-roundData.playerInfo[key].placedThisRound} points`
          : "No points gained :(")}`
          );
    */
    for(let i = 0; i < ids.length; i++){
        if(ids[i] === this.playerId){
            this.playerPointsText = this.add.text(700, i * 100 + 120, `${this.pointsInfo.playerInfo[ids[i]].points} points`, { color: 'white',fontSize: '26px'});

            this.player = new Player(this, 610, i * 100 + 144, 'zombiesprite', 'PC', this.socket, this.players[ids[i]].username)

        } else {
            this.otherPlayerPointsText[ids[i]] = this.add.text(700, i * 100 + 120, `${this.pointsInfo.playerInfo[ids[i]].points} points`, { color: 'white', fontSize: '26px ', align: 'center'});

            this.otherPlayers[ids[i]] = new Player(this, 610, i * 100 + 144, 'zombiesprite','NPC', null, this.players[ids[i]].username);

        }
    }

    //Timer created to show amount of remaining time points scene is displayed
    this.pointsTimer = this.add.text(675, 670, this.timerText, { color: '#ffc93c', fontSize: 30, align: 'center' }).setOrigin(0.5);

    //Socket stuff is below

    this.socket.on('roomLeaderboardInfo', (leaderboardArr) => {
      this.leaderboardInfo = leaderboardArr;
      this.orderPlayers();
      this.leaderboard();
    })

    this.socket.on("updatePointsTimer", (time) => {
      this.timerText = (this.winnerStatus ? `Ending game in ${time}`: `Next round in ${time}` )
      this.pointsTimer.setText(this.timerText);
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

    //Handles winner(s)
    if(this.winners.length > 0){
      //If only one winner, set them to be winner
      if(this.winners.length === 1){
        winner = this.winners[0]
        this.winnerId = winner.id;
      } else {
        //If multiple winners, first check to see who has the most points
        console.log("Multiple winners");
        let maxPoints = 0;
        for(const potentialWinner of this.winners){
          if(potentialWinner.points>maxPoints){
            maxPoints = potentialWinner.points;
          }
        }
        this.winners = this.winners.filter((winner) => winner.points === maxPoints)
        console.log("After filter, winners is",this.winners);
        if(this.winners.length === 1){
          winner = this.winners[0]
          this.winnerId = winner.id;
          console.log("Winner Info: ",winner);
        } else {
          console.log("It's a tie!");
          //If there are still multiple winners, it's a tie.
          //Skip updating the leaderboard (sorry, but you need to WIN to win) and immediately display
          this.socket.emit("displayLeaderboardWithWinner");
        }
      }
    }
    if(this.winnerId === this.playerId){
      this.socket.emit('updatePlayerNumOfWins', winner);
    }

    //After a delay, shows scene
    setTimeout(() => {
      this.scene.bringToTop("PointsScene");
    }, 1000)

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
      if(this.winners.length > 1){
        this.add.text(675, 630, `It's a tie!`, { color: '#ffc93c', fontSize: '26px'}).setOrigin(0.5)
      }
      else if (this.winnerId === this.playerId ) {
        this.add.text(this.player.x - 100, this.player.y - 24, `WIN`, { color: '#ffc93c', fontSize: '26px', align: 'center'})
        this.add.text(675, 630, `Congratulations, you WIN!`, { color: '#ffc93c', fontSize: '26px', align: 'center'}).setOrigin(0.5)
      } else {
        this.add.text(675, 630, `Sorry, you lose...`, { color: '#ffc93c', fontSize: '26px', align: 'center'}).setOrigin(0.5)
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
