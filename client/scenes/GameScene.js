import Phaser from "phaser"
import Platform from "../sprites/Platform.js";
import Player from "../sprites/Player.js"
import FallDetector from "../sprites/FallDetector.js";
import FinishLine from "../sprites/FinishLine.js";

//This scene handles the multiplayer game itself! 
//This is where the magic happens, folks

export default class GameScene extends Phaser.Scene {
    constructor(key) {
        super(key);
    }

    init(data){
        //Saves all passed data into the scene
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
        //Builds the base game map
        const self = this;
        this.add.image(640, 368, 'GameMapFinal')
        this.add.image(1252, 218, 'door')


        //adds sprite to serve as start point graphic
        this.add.image(84, 638, "startLine").setOrigin(0.5,1).setScale(0.45,0.45);

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

        // create static platforms at start and finish.
        this.staticPlatforms = this.physics.add.staticGroup();
        this.staticPlatforms.create(64, 642, 'staticPlatformStartLine');
        this.staticPlatforms.create(1230, 250, 'staticPlatformFinishLineRightSize');
        this.staticPlatforms.create(1200, 250, 'staticPlatformFinishLineRightSize');


        //Sets up group to hold all non-static platforms
        this.allPlatforms = this.add.group();

        //Initializes add platform button
        this.platformMaker = this.add.image(100, 50, 'addPlatformButton').setScale(0.6).setInteractive();
        this.platformMaker.on('pointerdown', () => {

          //In the multiplayer mode, platform dragging is disabled
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

        //Initializes remove platform button
        this.platformDestroyer = this.add.image(270, 50, "falseRemovePlatformButton").setScale(0.6).setInteractive();
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
        this.actionsRemaining = 8 - Object.keys(this.players).length;

        //Drops off 'sticky' platforms upon pointer up - platforms are defined as sticky when they are initially being placed
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

        //Generates finish line and "Fall Detector" sprite to signal when player has fallen off lower end of the map
        this.fallDetector = new FallDetector(this,this.socket);
        this.finishLine = new FinishLine(this,this.socket);

        //colliderinfo holds all sprites/requiring requiring collision handling for the player
        //Is it passed to the player to set up the appropriate colliders in the constructor
        this.colliderInfo = {
          staticPlatforms: this.staticPlatforms,
          platforms: this.allPlatforms,
          fallDetector: this.fallDetector,
          finishLine: this.finishLine
        }

        //Creates players
        let ids = Object.keys(this.players);
        for(let i = 0; i < ids.length; i++){
            if(ids[i] === this.playerId){
              //PC == Playable Character!
                this.player = new Player(this, this.players[ids[i]].x,this.players[ids[i]].y, 'zombiesprite', 'PC', this.socket, this.players[ids[i]].username, this.colliderInfo)

            } else {
                //NPC = Non-playable Character AKA the characters the player is racing against
                this.otherPlayers[ids[i]] = new Player(this, this.players[ids[i]].x, this.players[ids[i]].y, 'zombiesprite','NPC', null, this.players[ids[i]].username)
            }
        }

        // create drag action
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
          gameObject.x = dragX;
          gameObject.y = dragY;
          gameObject.update();
        })

        //Initializes lives display
        this.livesText = this.add.text(5, 660, `You have ${this.lives} lives`, { color: 'white',fontSize: '16px'});

        
        const {width} = this.scale;
        //Platform timer text initially rendered as "Players loading" until all players are ready
        this.platformTimer = this.add.text(width * 0.5, 20, "Players loading...", {fontSize: 26}).setOrigin(0.5);
        this.actionsDisplay = this.add.text(width * 0.5, 55, "", {fontSize: 26}).setOrigin(0.5);


        //Socket stuff is below

        //Ticks down the timer during build phase
        this.socket.on("updatePlatformTimer", (time) => {
          if(time>=9 && this.actionsRemaining > 0){
            //If the timer has just started, set up player's building tools
            //The actionsremaining clause is to prevent someone from destroying their game through spam clicking platforms in the first second :P
            this.actionsDisplay.setText(`Actions left: ${this.actionsRemaining}`);
            this.showPlatformButtons();
          }
          this.platformTimer.setText(`Time to Place Platforms: ${time}`);
        })

        //Initializes race phase and timer once build timer elapses
        this.socket.on("buildPhaseOver", () => {
            this.startGameTimer();
        })

        //Allows player to control character again when race setup is finished
        this.socket.on("startRace", () => {
          this.canControlPlayer = true;
        })

        //Ticks down the timer during race phase
        this.socket.on("updateGameTimer", (time) => {
          this.gameTimer.setText(`${time}`);
        })

        //triggers when the race timer has elapsed
        this.socket.on("raceTimeOver", (gameInfo) => {
          this.timesUp(gameInfo);
        })

        //triggers if all players finish before the race timer elapses
        this.socket.on("roundOver", (roundInfo, scene = self) => {
          //Destroys timer and pauses physics for points screen
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

        //Updates when player deletes a platform
        this.socket.on('platformRemoved', function(platformInfo, scene = self){
          scene.removePlatform(platformInfo.platformId);
        })

        //Triggers when the game ends
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

        //Handles a player losing all lives and "disappearing" early (all players disappear upon race phase end)
        this.socket.on('disappearedPlayer', function(playerId, scene = self) {
          if(scene.otherPlayers[playerId]){
            scene.otherPlayers[playerId].disappear();
            scene.otherPlayers[playerId].setVisible(false);
          }
        })

        //With all prior setup complete, hides players and signals to server that this client is ready for build phase!
        this.hideAllPlayers();
        //Hides platform buttons until all players are loaded in
        this.hidePlatformButtons();
        this.socket.emit("readyToBuild");

    }

    update () {
      if(this.player && this.phase === "race"){
        //Handles player movement
        this.player.update(this.cursors, this.canControlPlayer);
      }

      if(this.platformBeingPlaced && this.platformBeingPlaced.sticky && this.platformTable[this.platformBeingPlaced.id]){
        //Handles platform movement
        this.platformBeingPlaced.update(this.input.mousePointer);
      }

      //Updates addButtonToggle if any user-placed platform exists
      if (this.allPlatforms.children.entries.length) {
        this.addButtonToggle = true;
      } else {
        this.addButtonToggle = false;
      }
    }

    //Hides and disables physics and controls for all players, called during build phase. 
    hideAllPlayers(){
      this.player.disappear();
      for (const key of Object.keys(this.otherPlayers)) {
        this.otherPlayers[key].disappear();
      }
    }

    //Shows and disables physics and controls for all players, called during race phase. 
    showAllPlayers(){
      this.player.reappear();
      for (const key of Object.keys(this.otherPlayers)) {
        this.otherPlayers[key].reappear();
      }
    }

    //Hides and disables platform buttons, mostly used for the build phase to race phase transition
    hidePlatformButtons(){
      this.phase = "race";
      this.platformMaker.setVisible(false);
      this.platformDestroyer.setVisible(false);
      this.platformMaker.disableInteractive()
      this.platformDestroyer.disableInteractive();
      if (this.platformBeingPlaced) {
        //If player is in the middle of placing a platform, force the platform to be placed
          this.input.setDraggable(this.platformBeingPlaced,false);
          this.platformBeingPlaced.place();
          this.platformBeingPlaced = null;
      }
    }

    //Shows and enables platform buttons when build phase begins
    showPlatformButtons(){
      this.phase = "build"
      this.platformMaker.setVisible(true);
      this.platformDestroyer.setVisible(true);
      this.platformMaker.setInteractive()
      this.platformDestroyer.setInteractive();
    }

    //All the below code handles other players' platforms

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
      //Makes platform opaque to denote that it has been placed
      //(If I come back to this, add a stopper variable so that players cannot delete platforms currently being placed)
      this.platformTable[platformInfo.platformId].alpha = 1.0;
    }

    removePlatform(id){
      if (this.platformBeingPlaced && this.platformBeingPlaced.id === id) {
        this.platformBeingPlaced = null;
      }
      this.platformTable[id].destroy();
      delete this.platformTable[id];
    }

    //Handles platform deletion, only runs in the context of the remove platform button having been pressed
    onClicked(pointer, objectClicked) {
      if(this.allPlatforms.children.entries.includes(objectClicked) && this.removeButtonToggle && this.phase === 'build'){
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

    //Triggers when a player falls off the screen and loses a life
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

        //Sends a signal to indicate to the server that a player has PERISHED
        this.socket.emit('playerLostAllLives', this.player.scene.playerId)
      }
    }

    //Triggers when a player finishes!
    playerReachedFinish(){
      //Adds a temporary graphic above the finish line to denote successful finish!
      let finishText = this.add
      .text(this.finishLine.x+20, this.finishLine.y - 80, "Finished :D!", { fontSize: 14 })
      .setOrigin(0.5);
      this.destroyText(finishText);
      //Disables the finish line's physics body to prevent extraneous calls of this function
      this.finishLine.body.enable = false;
      this.canControlPlayer = false;
      //Forces the player to a standstill if they reach the finish line in motion
      this.player.stop();
      this.socket.emit("playerFinished", this.playerId);
    }

    handleDisconnect(){
        //If I come back to this: Send a message informing the player that the game has quit due to disconnect
        this.socket.emit("stopTimer");
    }

    closeGame(){
      if(this.pointsSceneRunning){
        //Stops the points scene, which will always be running in tandem with the game scene
        this.scene.stop("PointsScene");
      }
      //After closing listeners, sends a "leftLobby" signal to socket index so that player's socket listeners are closed on both ends.
      this.socket.removeAllListeners();
      this.socket.emit('leftLobby', this.playerId);
      this.scene.start("HomeScene", {socket: this.socket, user: this.playerInfo});
    }

    //Starts timer and general setup for race phase
    startGameTimer() {
      this.showAllPlayers();
      this.canControlPlayer = true;
      this.hidePlatformButtons();

      //Clears action counter + platform timer, un-toggles remove platform button if it was mid-use when time elapsed
      this.removeButtonToggle = false;
      this.platformDestroyer.clearTint();
      this.actionsDisplay.setText("");
      this.platformTimer.destroy();

      //Initiates race timer, signals to players that it is GO TIME!
      const { width, height } = this.scale
      this.gameTimer = this.add.text(width * 0.5, 20, "", {fontSize: 26}).setOrigin(0.5);
      this.socket.emit("readyToRace");
      this.text = this.add
        .text(width * 0.5, height * 0.5, "GO!", { fontSize: 50 })
        .setOrigin(0.5);
      this.destroyText(this.text);
    }

    //Handles timeout during race phase
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

    //Initializes scoring scene once a full round has completed
    roundOver(roundData){
      this.phase = "points";
      this.scene.launch("PointsScene", { gameScene: this, socket: this.socket, user: this.playerInfo, players: this.players, pointsInfo: roundData});
      this.pointsSceneRunning = true;
    }

    //This one's self-explanatory
    newRound(){
      //Since rounds always start with build phase, hides players in preparation
      this.hideAllPlayers();
      //Reset game state for new round
      for (const key of Object.keys(this.otherPlayers)) {
        this.otherPlayers[key].setPosition(96,535);
      }
      this.player.setPosition(96,535);
      this.lives = 3;
      this.livesText.setText(`You have ${this.lives} lives`);
      this.physics.resume();
      this.actionsRemaining = 8 - Object.keys(this.players).length;
      this.canControlPlayer = false;
      this.pointsSceneRunning = false;
      //Turns finish line's physics body back on (see playerFinished)
      this.finishLine.body.enable = true;
      //Makes sure everyone is synced back up for next round!
      this.platformTimer = this.add.text(this.scale.width * 0.5, 20, "Waiting for players...", {fontSize: 26}).setOrigin(0.5);
      this.socket.emit("readyToBuild");
    }

    //Function that deletes text after a 1.2 second delay
    destroyText(timerText) {
      setTimeout(function() {
        timerText.destroy();
      }, 1200)
    }

}
