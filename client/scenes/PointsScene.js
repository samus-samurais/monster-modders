import Phaser from "phaser"
import Player from "../sprites/Player";

//This scene displays in between rounds, and is used to show the players the scores!
//Or, if somebody has won, it displays the winner and the gmae leaderboard, updated in case a user manages to reach it with their win!

export default class PointsScene extends Phaser.Scene {
  constructor() {
    super('PointsScene');
    //Stores the names of all socket events used by the points scene
    //This lets us turn them off when we're done with them to prevent duplicating them through repeated pointsScene starting
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
    this.otherPlayerPointsGained = {}
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
    //Initially hides scene, displaying round over text in game scene while this scene loads
    this.scene.sendToBack("PointsScene");
    const self = this;
    this.recDisplayBackground = this.add.rectangle(680, 360, 480, 680, 0x009AA8);
    this.add.text(550, 45, `To Win: ${this.pointsInfo.pointsToWin} points`, { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '18px' });
    let winner = null;
    //Pushes all players that have passed the points required to win into winners array
    let ids = Object.keys(this.players)
    for(let j = 0; j < ids.length; j++){
      if (this.pointsInfo.playerInfo[ids[j]].points >= this.pointsInfo.pointsToWin) {
        this.winnerStatus = true;
        this.pointsInfo.playerInfo[ids[j]].id = ids[j];
        this.winners.push(this.pointsInfo.playerInfo[ids[j]]);
      }
    }

    //Sets up point scene display, showing how everybody scored this round, and everybody's total scores
    for(let i = 0; i < ids.length; i++){
        if(ids[i] === this.playerId){
            this.playerPointsText = this.add.text(700, i * 100 + 100, `${this.pointsInfo.playerInfo[ids[i]].points} points`, { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '16px'});
            this.playerPointsGained = this.add.text(700, i * 100 + 140, `${(this.pointsInfo.playerInfo[ids[i]].placedThisRound > 0 ?
              `+${this.pointsInfo.playerCount+1-this.pointsInfo.playerInfo[ids[i]].placedThisRound} points`
            : "+0 points :(")}`, { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '16px ', align: 'center'});

            this.player = new Player(this, 610, i * 100 + 144, 'zombiesprite', 'PC', this.socket, this.players[ids[i]].username)

        } else {
            this.otherPlayerPointsGained[ids[i]] = this.add.text(700, i * 100 + 100, `${(this.pointsInfo.playerInfo[ids[i]].placedThisRound > 0 ?
              `+${this.pointsInfo.playerCount+1-this.pointsInfo.playerInfo[ids[i]].placedThisRound} points`
            : "+0 points :(")}`, { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '16px'});
            this.otherPlayerPointsText[ids[i]] = this.add.text(700, i * 100 + 140, `${this.pointsInfo.playerInfo[ids[i]].points} points`, { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '16px' });

            this.otherPlayers[ids[i]] = new Player(this, 610, i * 100 + 144, 'zombiesprite','NPC', null, this.players[ids[i]].username);

        }
    }

    //Timer created to show amount of remaining time points scene is displayed for
    this.pointsTimer = this.add.text(675, 670, this.timerText, { color: '#ffc93c', fontFamily: '"Press Start 2P"', fontSize: '24px' }).setOrigin(0.5);

    //With everything for the points scene set up, sends signal to start points scene timer
    this.socket.emit("displayPoints");

    //Socket stuff is below

    //Sets up leaderboard with info recieved
    this.socket.on('roomLeaderboardInfo', (leaderboardArr) => {
      this.leaderboardInfo = leaderboardArr;
      this.orderPlayers();
      this.leaderboard();
    })

    //Ticks down aforementioned points timer
    this.socket.on("updatePointsTimer", (time) => {
      this.timerText = (this.winnerStatus ? `Ending game in ${time}`: `Next round in ${time}` )
      this.pointsTimer.setText(this.timerText);
    })

    //Triggers when pointsTimer elapses, triggers function that closes points scene
    this.socket.on("pointsSceneOver", () => {
      this.timesUp();
    })

    //Triggers when the leaderboard has been updated with a user's new win, and is ready for display
    this.socket.on("leaderboardReadyForDisplay", () => {
      this.socket.emit('displayLeaderboardWithWinner');
    })

    //Closes game upon disconnect
    //This might be superfluous, but I don't have the time to find out right now :T
    this.socket.on('finishedGame', (info, scene = self) => {
      if(info.cause === "disconnect"){
        scene.handleDisconnect();
      }
      scene.closeGame();
    })

    //Handles winner(s)
    if(this.winners.length > 0){
      //If only one winner, set them to be winner
      if(this.winners.length === 1){
        winner = this.winners[0]
        this.winnerId = winner.id;
      } else {
        //If multiple winners, first check to see who has the most points
        let maxPoints = 0;
        for(const potentialWinner of this.winners){
          if(potentialWinner.points>maxPoints){
            maxPoints = potentialWinner.points;
          }
        }
        this.winners = this.winners.filter((winner) => winner.points === maxPoints)
        if(this.winners.length === 1){
          winner = this.winners[0]
          this.winnerId = winner.id;
        } else {
          //If there are multiple people with the same point values, it's a tie.
          //Skip updating the leaderboard (sorry, but you need to WIN to win) and immediately display
          this.socket.emit("displayLeaderboardWithWinner");
        }
      }
    }
    //If there is a winner, start the update->display leaderboard sequence
    if(this.winnerId === this.playerId){
      this.socket.emit('updatePlayerNumOfWins', winner);
    }

    //After a delay, shows scene
    setTimeout(() => {
      this.scene.bringToTop("PointsScene");
    }, 1000)

  }

  //Makes sure player doesn't move EVER
  //(If I come back to this: We could probably handle this better lol)
  update () {
    if (this.player) {
      this.player.body.moves = false;
      this.player.body.allowGravity = false;
    }
  }

  //Orders players based on ranking
  //(If I come back to this: Honestly I'm pretty sure this doesn't even work half the time, might wanna look into that)
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
        this.add.text(675, 630, `It's a tie!`, { color: '#ffc93c', fontFamily: '"Press Start 2P"', fontSize: '16px', align: 'center' }).setOrigin(0.5)
      }
      else if (this.winnerId === this.playerId ) {
        this.add.text(this.player.x - 100, this.player.y - 24, `WIN`, { color: '#ffc93c', fontFamily: '"Press Start 2P"', fontSize: '16px', align: 'center' })
        this.add.text(675, 630, `Congratulations, you WIN!`, { color: '#ffc93c', fontFamily: '"Press Start 2P"', fontSize: '16px', align: 'center' }).setOrigin(0.5)
      } else {
        this.add.text(675, 630, `Sorry, you lose...`, { color: '#ffc93c', fontFamily: '"Press Start 2P"', fontSize: '16px', align: 'center' }).setOrigin(0.5)
      }
    }
  }

  //Sets up leaderboard display
  leaderboard() {
    if (this.leaderboardInfo && this.winnerStatus) {
      this.rectangleBackground = this.add.rectangle(215, 360, 380, 680, 0x009AA8);
      this.add.text(80, 50, `PLAYER LEADERBOARD`, { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '16px'});
      this.add.text(110, 90, `Player Username`, { color: 'purple', fontFamily: '"Press Start 2P"', fontSize: '12px' });
      this.add.text(310, 90, `Wins`, { color: 'purple', fontFamily: '"Press Start 2P"', fontSize: '12px'});
      // display top 10 users' information
      for (let i=0; i < this.leaderboardInfo.length; i++) {
        if (i <= 2) {
          this.add.image(90, i * 55 + 155, `top${i + 1}`)
        }
        this.add.text(140, i * 55 + 130, `${this.leaderboardInfo[i].username}`, { color: 'purple', fontFamily: '"Press Start 2P"', fontSize: '16px'});
        this.add.text(320, i * 55 + 130, `${this.leaderboardInfo[i].number_of_wins}`, { color: 'purple', fontFamily: '"Press Start 2P"', fontSize: '16px'});
      }
    }
  }

  //Handles disconnect and game closing
  //(If I come back to this: I'm pretty sure we don't even need these?)
  handleDisconnect(){
    this.socket.emit("stopTimer");
  }

  closeGame(){
    this.pointsEvents.forEach((evt) => this.socket.removeAllListeners(evt));
    this.scene.stop("PointsScene");
  }

  //Ends the points scene when time elapses
  timesUp() {
    this.pointsTimer.destroy();
    if (!this.winnerStatus) {
      this.gameScene.newRound();
      this.pointsEvents.forEach((evt) => this.socket.removeAllListeners(evt));
      this.scene.stop("PointsScene");
    } else {
      this.socket.emit("gameOver");
      this.gameScene.closeGame();
    }
  }

}
