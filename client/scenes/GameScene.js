import Phaser from "phaser"
import Platform from "../sprites/Platform.js";
import Player from "../sprites/Player.js"
import FallDetector from "../sprites/FallDetector.js";

export default class GameScene extends Phaser.Scene {
    constructor(key) {
        super(key);
        this.player = null
        this.otherPlayers = {}
        // // make sure that lost player couldn't use platformMaker button
        // this.allowAddPlatform = true;
        this.addButtonToggle = false;
        this.removeButtonToggle = false;
        this.platformMaker = null;
        this.platformDestroyer = null;
        this.platformBeingPlaced = null;
        //For multiplayer, platforms are stored in a platform table as well as a group
        //This lets us access and manipulate specific platforms via sockets more easily!
        this.platformTable = {};
        this.lives = 3;
        this.gameTimer = null;
        this.platformButtonsState = true;
    }

    init(data){
        this.socket = data.socket;
        this.playerId = data.socket.id;
        this.players = data.players;
    }

    create(){
        const self = this;
        this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);

        //stop waiting scene music
        this.sound.stopAll();
        //play game music
        this.gameMusic = this.sound.add("gameMusic");
        this.gameMusic.play({volume: 0.2, loop: true});

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

        this.allPlatforms = this.add.group();

        this.platformMaker = this.add.image(100, 100, 'addPlatformButton').setInteractive();
        this.platformMaker.on('pointerdown', () => {

          if(this.platformBeingPlaced && this.platformTable[this.platformBeingPlaced.id]){
            this.input.setDraggable(this.platformBeingPlaced,false);
          }
          //Generates new platform, sets it to platform being placed
          const userPlatform = new Platform(self, this.input.mousePointer.x, this.input.mousePointer.y, "platform", this.socket);
          //Adds platform to both group and table
          this.allPlatforms.add(userPlatform);
          this.platformTable[userPlatform.id] = userPlatform
          this.input.setDraggable(userPlatform);
          this.platformBeingPlaced = userPlatform
        });

        this.platformDestroyer = this.add.image(600, 100, "falseRemovePlatformButton").setInteractive();
        this.platformDestroyer.on('pointerdown', () => {
          // remove button don't work until user creates at least one platform
          if (this.addButtonToggle) {
            this.removeButtonToggle = true
            // change the button color to show that in this state user could delete a platform.
            this.platformDestroyer.setTint(0xff0000);
            this.input.on('gameobjectdown', this.onClicked.bind(this));
          }
        })

        //Drops off sticky platforms upon click
        this.input.on('pointerup',() => {
          if(this.platformBeingPlaced && this.platformBeingPlaced.sticky){
          this.platformBeingPlaced.place();
          }
        })

        //Generates "Fall Detector" sprite to signal when player has fallen off lower end of the map
        this.fallDetector = new FallDetector(this,this.socket);

        //Creates players, passes in world objects for collider initializations in player constructor
        this.colliderInfo = {
          staticPlatforms: this.staticPlatforms,
          platforms: this.allPlatforms,
          fallDetector: this.fallDetector
        }
        let ids = Object.keys(this.players);
        for(let i = 0; i < ids.length; i++){
            if(ids[i] === this.playerId){
                console.log("Player built in multiplayer file!"); //PC == Playable Character!
                this.player = new Player(this, this.players[ids[i]].x,this.players[ids[i]].y, 'dude', 'PC', this.socket, this.players[ids[i]].username, this.colliderInfo)

                console.log('here is the PC player-----', this.player);
            } else {
                console.log("NPC built in multiplayer file"); //NPC = Non-playable Character
                this.otherPlayers[ids[i]] = new Player(this, this.players[ids[i]].x, this.players[ids[i]].y, 'dude','NPC', null, this.players[ids[i]].username)
            }
        }

        // create drag action
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
          gameObject.x = dragX;
          gameObject.y = dragY;
          gameObject.update();
        })

        this.livesText = this.add.text(100, 620, `You have ${this.lives} lives`, { color: 'purple', fontFamily: 'Arial', fontSize: '26px ', align: 'center'});

        this.physics.add.overlap(this.player, this.colliderInfo.fallDetector, this.lostTheGame, null, this);

        const {width} = this.scale;
        //Platform timer text initially rendered as "Players loading" until all players are ready
        this.platformTimer = this.add.text(width * 0.5, 20, "Players loading...", {fontSize: 30}).setOrigin(0.5);

        //Socket stuff is below

        this.socket.on("updatePlatformTimer", (time) => {
          console.log("Platform timer updated");
          this.platformTimer.setText(`Time to Place Platforms: ${time}`);
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

        console.log("This loads");
        this.socket.emit("readyToBuild");

    }

    update () {
      if(this.player){
        this.player.update(this.cursors);
      }

      if(this.platformBeingPlaced && this.platformBeingPlaced.sticky && this.platformTable[this.platformBeingPlaced.id]){
        this.platformBeingPlaced.update(this.input.mousePointer);
      }

      if (this.allPlatforms.children.entries.length) {
        this.addButtonToggle = true;
      } else {
        this.addButtonToggle = false;
      }

      if (!this.platformButtonsState) {
        // when gameTimer begin to work, platformButtons should be disappeared.
        this.platformMaker.setVisible(false);
        this.platformDestroyer.setVisible(false);
        if (this.platformBeingPlaced) {
          this.input.setDraggable(this.platformBeingPlaced,false);
        }
      }

      if (this.platformButtonsState && this.player || this.lives <= 0) {
        this.player.body.moves = false;
      } else if (this.player) {
        this.player.body.moves = true;
      }

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
      this.platformTable[id].destroy();
      delete this.platformTable[id];
    }

    onClicked(pointer, objectClicked) {
      if(this.allPlatforms.children.entries.includes(objectClicked) && this.removeButtonToggle && this.platformButtonsState){
        if (this.platformBeingPlaced && objectClicked.id === this.platformBeingPlaced.id) {
          this.platformBeingPlaced = null;
        }
        this.allPlatforms.remove(objectClicked);
        this.socket.emit("removePlatform",{platformId: objectClicked.id});
        objectClicked.destroy();
        this.removeButtonToggle = false;
        this.platformDestroyer.clearTint();
      }
    }

    lostTheGame() {
      this.deathSound = this.sound.add("deathSound");
      this.deathSound.play({volume: 0.3});
      this.lives -= 1;
      this.livesText.setText(`You have ${this.lives} lives`)

      if (this.lives <= 0) {
        this.livesText.destroy();
        this.add.text(400, 570, `Sorry, you have lost all lives o(╥﹏╥)o`, { color: 'purple', fontFamily: 'Arial', fontSize: '36px ', align: 'center'});
        this.player.disappear();
        this.player.setVisible(false);
        // this.allowAddPlatform = false;
        this.addButtonToggle = false;
        this.removeButtonToggle = false;

        this.socket.emit('playerLostAllLives', this.player.scene.playerId)
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
      this.scene.start("HomeScene");
    }

    removePlayer(id){
        console.log("Removing player with id:",id)
        this.otherPlayers[id].delete();
        delete this.otherPlayers[id];
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
