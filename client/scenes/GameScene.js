import Phaser from "phaser"
import Platform from "../sprites/Platform.js";
import Player from "../sprites/Player.js"
import FallDetector from "../sprites/FallDetector.js";
import FinishLine from "../sprites/FinishLine.js";

export default class GameScene extends Phaser.Scene {
    constructor(key) {
        super(key);
        this.placementStatuses = ["did not finish...","placed 1st!","placed 2nd.", "placed 3rd.","placed 4th."];
    }

    init(data){
        this.socket = data.socket;
        this.playerId = data.socket.id;
        this.playerInfo = data.user ? data.user : null
        this.players = data.players;

        //Sets all important variables to default values
        this.player = null
        this.otherPlayers = {}
        this.addButtonToggle = false;
        this.removeButtonToggle = false;
        this.platformMaker = null;
        this.platformDestroyer = null;
        this.platformBeingPlaced = null;
        this.canControlPlayer = false;
        this.phase = "build";
        //For multiplayer, platforms are stored in a platform table as well as a group
        //This lets us access and manipulate specific platforms via sockets more easily!
        this.platformTable = {};
        this.lives = 3;
        this.actionsRemaining = 0;
        this.gameTimer = null;
        this.pointsSceneRunning = false;
    }

    create(){
        const self = this;
        this.add.image(640, 368, 'GamemapScreenshot')
        //Resumes physics in case game quit while physics was paused
        this.physics.resume();

        //stop waiting scene music
        this.sound.stopAll();
        //play game music
        this.gameMusic = this.sound.add("gameMusic");
        this.gameMusic.play({volume: 0.4, loop: true});

        //Sets up controls
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        //Sets world such that players can go past top and bottom of screen, but not sides
        this.physics.world.setBoundsCollision(true,true,false,false);

        // create static platforms as begining and goal place.
        this.staticPlatforms = this.physics.add.staticGroup();
        this.staticPlatforms.create(200, 600, 'platform');
        this.staticPlatforms.create(1000, 200, 'platform');

        //adds sprite to serve as start point graphic
        this.add.image(210,584,"startLine").setOrigin(0.5,1).setScale(0.45,0.45);

        this.allPlatforms = this.add.group();

        this.platformMaker = this.add.image(120, 60, 'addPlatformButton').setScale(0.9,0.9).setInteractive();
        this.platformMaker.on('pointerdown', () => {

          if(this.platformBeingPlaced && this.platformTable[this.platformBeingPlaced.id]){
            this.input.setDraggable(this.platformBeingPlaced,false);
          }
          //Generates new platform, sets it to platform being placed
          const userPlatform = new Platform(self, this.input.mousePointer.x, this.input.mousePointer.y, "broomplatform", this.socket);
          //Adds platform to both group and table
          this.allPlatforms.add(userPlatform);
          this.platformTable[userPlatform.id] = userPlatform
          this.input.setDraggable(userPlatform);
          this.platformBeingPlaced = userPlatform
        });

        this.platformDestroyer = this.add.image(120, 170, "falseRemovePlatformButton").setScale(0.9,0.9).setInteractive();
        this.platformDestroyer.on('pointerdown', () => {
          // remove button don't work until user creates at least one platform
          if (this.addButtonToggle) {
            this.removeButtonToggle = true
            // change the button color to show that in this state user could delete a platform.
            this.platformDestroyer.setTint(0xff0000);
            this.input.on('gameobjectdown', this.onClicked.bind(this));
          }
        })

        //Defines the number of actions a player can take based off of players in lobby
        this.actionsRemaining = 7 - Object.keys(this.players).length;

        //Drops off sticky platforms upon pointer up
        this.input.on('pointerup',() => {
          if(this.platformBeingPlaced && this.platformBeingPlaced.sticky && this.platformTable[this.platformBeingPlaced.id]){
          //Reduces remaining actions if a platform was dropped off, disables platform buttons when out of actions
          this.actionsRemaining -= 1;
          this.actionsDisplay.setText(`Actions left: ${this.actionsRemaining}`);
          if(this.actionsRemaining===0){
            this.hidePlatformButtons();
          }
          this.platformBeingPlaced.place();
          }
        })

        //Generates "Fall Detector" sprite to signal when player has fallen off lower end of the map
        this.fallDetector = new FallDetector(this,this.socket);
        this.finishLine = new FinishLine(this,this.socket);

        //Creates players, passes in world objects for collider initializations in player constructor
        this.colliderInfo = {
          staticPlatforms: this.staticPlatforms,
          platforms: this.allPlatforms,
          fallDetector: this.fallDetector,
          finishLine: this.finishLine
        }

        let ids = Object.keys(this.players);
        for(let i = 0; i < ids.length; i++){
            if(ids[i] === this.playerId){
                console.log("Player built in multiplayer file!"); //PC == Playable Character!
                this.player = new Player(this, this.players[ids[i]].x,this.players[ids[i]].y, 'zombiesprite', 'PC', this.socket, this.players[ids[i]].username, this.colliderInfo)

                console.log('here is the PC player-----', this.player);
            } else {
                console.log("NPC built in multiplayer file"); //NPC = Non-playable Character
                this.otherPlayers[ids[i]] = new Player(this, this.players[ids[i]].x, this.players[ids[i]].y, 'zombiesprite','NPC', null, this.players[ids[i]].username)
            }
        }

        // create drag action
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
          gameObject.x = dragX;
          gameObject.y = dragY;
          gameObject.update();
        })

        this.livesText = this.add.text(100, 620, `You have ${this.lives} lives`, { color: 'white', fontFamily: 'Arial', fontSize: '26px ', align: 'center'});

        const {width} = this.scale;
        //Platform timer text initially rendered as "Players loading" until all players are ready
        this.platformTimer = this.add.text(width * 0.5, 20, "Players loading...", {fontSize: 30}).setOrigin(0.5);
        this.actionsDisplay = this.add.text(width * 0.5, 55, "", {fontSize: 30}).setOrigin(0.5);

        //Socket stuff is below

        this.socket.on("updatePlatformTimer", (time) => {
          if(this.actionsDisplay.text === ""){
            this.actionsDisplay.setText(`Actions left: ${this.actionsRemaining}`);
          }
          console.log("Platform timer updated");
          this.platformTimer.setText(`Time to Place Platforms: ${time}`);
        })

        this.socket.on("buildPhaseOver", () => {
            this.startGameTimer();
        })

        this.socket.on("startRace", () => {
          this.canControlPlayer = true;
        })

        this.socket.on("updateGameTimer", (time) => {
          console.log("Game timer updated", time);
          this.gameTimer.setText(`${time}`);
        })

        this.socket.on("raceTimeOver", (gameInfo) => {
          this.timesUp(gameInfo);
        })

        this.socket.on("roundOver", (roundInfo, scene = self) => {
          this.gameTimer.destroy();
          this.physics.pause();
          const { width, height } = scene.scale;
          scene.text = scene.add
            .text(width * 0.5, height * 0.5, "Round Over!", { fontSize: 50 })
            .setOrigin(0.5);
          scene.destroyText(scene.text);
          scene.roundOver(roundInfo);
        })

        //Adds new platform when other player creates
        this.socket.on('platformAdded', function(platformInfo, scene = self){
          console.log("Adding platform w info",platformInfo);
          scene.addPlatform(platformInfo);
        })

        //Updates when player moves their platform
        this.socket.on('platformMoved', function(platformInfo, scene = self){
          scene.updatePlatform(platformInfo);
        })

        //Updates when player places their platform
        this.socket.on('platformPlaced', function(platformInfo, scene = self){
          scene.platformPlaced(platformInfo);
        })

        //Updates when player places their platform
        this.socket.on('platformRemoved', function(platformInfo, scene = self){
          scene.removePlatform(platformInfo.platformId);
        })

        this.socket.on('finishedGame', function(info, scene = self){
          if(info.cause === "disconnect"){
            scene.handleDisconnect();
          }
          scene.closeGame();
        })


        //Updates other players when they move
        this.socket.on('playerMoved', function (movementState, scene = self) {
            if(scene.otherPlayers[movementState.playerId]){
              scene.otherPlayers[movementState.playerId].updateOtherPlayer(movementState);
            }
        });

        this.socket.on('disappearedPlayer', function(playerId, scene = self) {
          if(scene.otherPlayers[playerId]){
            scene.otherPlayers[playerId].disappear();
            scene.otherPlayers[playerId].setVisible(false);
          }
        })

        this.hideAllPlayers();
        this.socket.emit("readyToBuild");

    }

    update () {
      if(this.player && this.phase === "race"){
        this.player.update(this.cursors, this.canControlPlayer);
      }

      if(this.platformBeingPlaced && this.platformBeingPlaced.sticky && this.platformTable[this.platformBeingPlaced.id]){
        this.platformBeingPlaced.update(this.input.mousePointer);
      }

      if (this.allPlatforms.children.entries.length) {
        this.addButtonToggle = true;
      } else {
        this.addButtonToggle = false;
      }
    }

    hideAllPlayers(){
      this.player.disappear();
      for (const key of Object.keys(this.otherPlayers)) {
        this.otherPlayers[key].disappear();
      }
    }

    showAllPlayers(){
      this.player.reappear();
      for (const key of Object.keys(this.otherPlayers)) {
        this.otherPlayers[key].reappear();
      }
    }

    hidePlatformButtons(){
      this.phase = "race";
      this.platformMaker.setVisible(false);
      this.platformDestroyer.setVisible(false);
      this.platformMaker.disableInteractive()
      this.platformDestroyer.disableInteractive();
      if (this.platformBeingPlaced) {
          this.input.setDraggable(this.platformBeingPlaced,false);
          this.platformBeingPlaced.place();
          this.platformBeingPlaced = null;
      }
    }

    showPlatformButtons(){
      this.phase = "build"
      this.platformMaker.setVisible(true);
      this.platformDestroyer.setVisible(true);
      this.platformMaker.setInteractive()
      this.platformDestroyer.setInteractive();
    }

    addPlatform(platformInfo){
          //Generates new platform, sets it to platform being placed by opponent
          const userPlatform = new Platform(this, platformInfo.x, platformInfo.y, platformInfo.spriteKey, this.socket, platformInfo.platformId);
          //Adds platform to both group and table
          this.allPlatforms.add(userPlatform);
          this.input.setDraggable(userPlatform,false);
          this.platformTable[userPlatform.id] = userPlatform
    }

    updatePlatform(platformInfo){
      this.platformTable[platformInfo.platformId].setPosition(platformInfo.x,platformInfo.y)
    }

    platformPlaced(platformInfo){
      this.platformTable[platformInfo.platformId].alpha = 1.0;
    }

    removePlatform(id){
      console.log("ID to remove:",id)
      console.log("Platform table",this.platformTable);
      if (this.platformBeingPlaced && this.platformBeingPlaced.id === id) {
        this.platformBeingPlaced = null;
      }
      this.platformTable[id].destroy();
      delete this.platformTable[id];
    }

    //Handles platform deletion
    onClicked(pointer, objectClicked) {
      if(this.allPlatforms.children.entries.includes(objectClicked) && this.removeButtonToggle){
        if (this.platformBeingPlaced && objectClicked.id === this.platformBeingPlaced.id) {
          this.platformBeingPlaced = null;
        }
        this.allPlatforms.remove(objectClicked);
        this.socket.emit("removePlatform",{platformId: objectClicked.id});
        objectClicked.destroy();
        this.removeButtonToggle = false;
        this.platformDestroyer.clearTint();
        //Reduces remaining actions when a platform is deleted, disables platform buttons when out of actions
        this.actionsRemaining -= 1;
        this.actionsDisplay.setText(`Actions left: ${this.actionsRemaining}`);
        if(this.actionsRemaining===0){
          this.hidePlatformButtons();
        }
      }
    }

    loseLives() {
      this.deathSound = this.sound.add("deathSound");
      this.deathSound.play({volume: 0.3});
      this.lives -= 1;
      this.livesText.setText(`You have ${this.lives} lives`)

      if (this.lives <= 0) {
        this.canControlPlayer = false;
        this.livesText.setText("Sorry, you have lost all lives o(╥﹏╥)o");
        this.player.disappear();
        this.player.setVisible(false);
        this.addButtonToggle = false;
        this.removeButtonToggle = false;

        this.socket.emit('playerLostAllLives', this.player.scene.playerId)
      }

    }

    playerReachedFinish(){
      this.finishLine.body.enable = false;
      this.canControlPlayer = false;
      this.player.stop();
      this.socket.emit("playerFinished", this.playerId);
    }

    handleDisconnect(){
        //TODO: Send a message informing the player that the game has quit due to disconnect
        console.log("Stopping timer");
        this.socket.emit("stopTimer");
    }

    closeGame(){
      if(this.pointsSceneRunning){
        this.scene.stop("PointsScene");
      }
      console.log("Game is over");
      //Sets platform buttons back to visible for next game
      //After closing listeners, sends a "leftLobby" signal to socket index so that player's socket listeners are closed on both ends.
      this.socket.removeAllListeners();
      this.socket.emit('leftLobby', this.playerId);
      this.scene.start("HomeScene", {socket: this.socket, user: this.playerInfo});
    }

    removePlayer(id){
        console.log("Removing player with id:",id)
        this.otherPlayers[id].delete();
        delete this.otherPlayers[id];
    }

    startGameTimer() {
      this.showAllPlayers();
      this.canControlPlayer = true;
      this.hidePlatformButtons();
      this.actionsDisplay.setText("");
      this.platformTimer.destroy();
      const { width, height } = this.scale
      this.gameTimer = this.add.text(width * 0.5, 20, "", {fontSize: 30}).setOrigin(0.5);
      this.socket.emit("readyToRace");
      this.text = this.add
        .text(width * 0.5, height * 0.5, "GO!", { fontSize: 50 })
        .setOrigin(0.5);
      this.destroyText(this.text);
    }

    timesUp(gameInfo) {
      this.gameTimer.destroy();
      this.physics.pause(); //don't let players move if time runs out
      const { width, height } = this.scale;
      this.text = this.add
        .text(width * 0.5, height * 0.5, "Time's Up!", { fontSize: 50 })
        .setOrigin(0.5);
      this.destroyText(this.text);
      this.roundOver(gameInfo);
    }

    roundOver(roundData){
      this.phase = "points";
      for (const key of Object.keys(roundData.playerInfo)){
        console.log(
          `${roundData.playerInfo[key].username} ${this.placementStatuses[roundData.playerInfo[key].placedThisRound]}
          ${(roundData.playerInfo[key].placedThisRound > 0 ?
            `+${roundData.playerCount+1-roundData.playerInfo[key].placedThisRound} points`
          : "No points gained :(")}`
          );
      }
      this.scene.launch("PointsScene", { gameScene: this, socket: this.socket, user: this.playerInfo, players: this.players, pointsInfo: roundData});
      this.pointsSceneRunning = true;
    }

    newRound(){
      this.hideAllPlayers();
      console.log("New round starting!");

      //Reset game state for new round
      for (const key of Object.keys(this.otherPlayers)) {
        this.otherPlayers[key].setPosition(200,535);
      }
      this.player.setPosition(200,535);
      this.lives = 3;
      this.livesText.setText(`You have ${this.lives} lives`);
      this.physics.resume();
      this.actionsRemaining = 7 - Object.keys(this.players).length;

      this.canControlPlayer = false;
      this.showPlatformButtons();
      this.finishLine.body.enable = true;
      this.platformTimer = this.add.text(this.scale.width * 0.5, 20, "Waiting for players...", {fontSize: 30}).setOrigin(0.5);
      this.socket.emit("readyToBuild");
      this.pointsSceneRunning = false;
    }

    destroyText(timerText) {
      setTimeout(function() {
        timerText.destroy();
      }, 2000)
    }

}