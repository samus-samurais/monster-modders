import Phaser from "phaser"
import Player from "../sprites/Player";

export default class PointsScene extends Phaser.Scene {
  constructor() {
    super('PointsScene');
    this.player = null
    this.otherPlayers = {}
    this.otherPlayerPointsText = {}
    this.gameTimer = null;
    this.pointsTimer = null;
    this.leaveRoomButton = null;
    this.otherLeaveRoomButtons = {}
  }

  init(data) {
    this.socket = data.socket;
    this.playerId = data.socket.id;
    this.playerInfo = data.user ? data.user : null;
    this.players = data.players;
    console.log("here is the pointsScene's players----", this.players)
  }

  create() {
    const self = this;
    this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);

    let ids = Object.keys(this.players);
    for(let i = 0; i < ids.length; i++){
        if(ids[i] === this.playerId){
            this.playerPointsText = this.add.text(450, i * 144 + 144, `${4} points`, { color: 'purple', fontFamily: 'Arial', fontSize: '26px ', align: 'center'});

            this.player = new Player(this, 400, i * 144 + 144, 'dude', 'PC', this.socket, this.players[ids[i]].username)
            this.player.moves = false;

            // if there is a winner player, then show the leaveRoomButton
            this.leaveRoomButton = this.add.image(800, i * 144 + 144, 'leaveRoomButton').setInteractive();
            this.leaveRoomButton.on('pointerdown', () => {

              // get the winner player info
              // const winnerPlayerId = ?

              // send the winner player info to the back end and update the player's number of wins
              // this.socket.emit('updatePlayerNumOfWins', winnerPlayerId)




              this.scene.stop("PointsScene");
              this.scene.start("HomeScene", { socket: this.socket, user: this.playerInfo })
            });

        } else {
            this.otherPlayerPointsText[ids[i]] = this.add.text(450, i * 144 + 144, `${4} points`, { color: 'purple', fontFamily: 'Arial', fontSize: '26px ', align: 'center'});

            this.otherPlayers[ids[i]] = new Player(this, 400, i * 144 + 144, 'dude','NPC', null, this.players[ids[i]].username);
            this.otherPlayers[ids[i]].moves = false;

            // if there is a winner player, then show the leaveRoomButton
            this.otherLeaveRoomButtons[ids[i]] = this.add.image(800, i * 144 + 144, 'leaveRoomButton')
        }
    }

    // if there is no winner player info, we create a timer to count 5 seconds to show the points scene.
    const {width} = this.scale;
    //Platform timer text initially rendered as "Players loading" until all players are ready
    this.pointsTimer = this.add.text(width * 0.5, 20, "Players' points loading...", {fontSize: 30}).setOrigin(0.5);


    //Removes player if other player click their button
    // this.socket.on('playerLeave', function (id, scene = self) {
    //   scene.playerLeave(id)
    // });


    //Socket stuff is below

    this.socket.on("updatePlatformTimer", (time) => {
      console.log("Platform timer updated");
      this.pointsTimer.setText(`Time to show players points: ${time}`);
    })

    this.socket.on("buildPhaseOver", (scene = self) => {
        scene.startGameTimer();
    })

    this.socket.on("updateGameTimer", (time) => {
      console.log("Game timer updated");
      this.gameTimer.setText(`${time}`);
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

    console.log("This loads");
    this.socket.emit("readyToBuild");
  }

  update () {

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
    this.scene.start("HomeScene", {socket: this.socket, user: this.playerInfo});
  }

  playerLeave(id){
    console.log("other player leaves with id:",id)
    this.otherPlayers[id].setTint(0xFF0000);
    this.otherPlayerPointsText[id].setTint(0xFF0000);
    this.otherLeaveRoomButtons[id].setTint(0xFF0000);
    this.otherPlayers[id].delete();
    // delete this.otherPlayers[id];
  }

  startGameTimer() {
    this.platformButtonsState = false;
    this.platformTimer.destroy();
    const { width, height } = this.scale
    this.gameTimer = this.add.text(width * 0.5, 20, "", {fontSize: 30}).setOrigin(0.5);
    this.socket.emit("readyToRace");
    this.text = this.add
      .text(width * 0.5, height * 0.5, "GO!", { fontSize: 50 })
      .setOrigin(0.5);

    this.destroyText(this.text);
  }

  timesUp() {
    this.gameTimer.destroy();
    this.physics.pause(); //don't let players move if time runs out
    const { width, height } = this.scale;
    this.text = this.add
      .text(width * 0.5, height * 0.5, "Time's Up!", { fontSize: 50 })
      .setOrigin(0.5);
  }


  destroyText(timerText) {
    setTimeout(function() {
      timerText.destroy();
    }, 2000)
  }

}
