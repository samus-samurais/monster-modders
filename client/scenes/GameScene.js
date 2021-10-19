import Phaser from "phaser"
import Platform from "../sprites/Platform.js";
import Player from "../sprites/Player.js"
import FallDetector from "../sprites/FallDetector.js";

export default class GameScene extends Phaser.Scene {
    constructor(key) {
        super(key);
        this.player = null
        this.otherPlayers = {}
        this.addButtonToggle = false;
        this.removeButtonToggle = false;
        this.platformMaker = null;
        this.platformDestroyer = null;
        this.platformBeingPlaced = null;
        //For multiplayer, platforms are stored in a platform table as well as a group
        //This lets us access and manipulate specific platforms via sockets more easily!
        this.platformTable = {};
    }

    init(data){
        this.socket = data.socket;
        this.playerId = data.socket.id;
        this.players = data.players;
    }

    create(){

        const self = this;
        this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);

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
          //Sets it so that only the most recently placed platform can be draggable
          if(this.platformBeingPlaced){
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
          console.log(';;;;;;;sticky=false', this.allPlatforms.children.entries.filter(child => child.sticky === false))
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


        //Socket stuff is below

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

        //Removes player if player disconnects
        this.socket.on('playerLeft', function (id, scene = self) {
          scene.removePlayer(id)
      });


      //Updates other players when they move
      this.socket.on('playerMoved', function (movementState, scene = self) {
          if(scene.otherPlayers[movementState.playerId]){
          scene.otherPlayers[movementState.playerId].updateOtherPlayer(movementState);
          }
      });

      this.socket.on('platformRemoved', function (platform, scene = self) {
        // if (scene.platformTable[platformId]) {
          scene.removePlatform(platform)
        // }
      })
    }

    update () {
      if(this.player){
        this.player.update(this.cursors);
      }

      if(this.platformBeingPlaced && this.platformBeingPlaced.sticky){
        this.platformBeingPlaced.update(this.input.mousePointer);
      }

      if (this.allPlatforms.children.entries.filter(child => child.sticky === false).length) {
        this.addButtonToggle = true;
      } else {
        this.addButtonToggle = false;
      }

    }

    addPlatform(platformInfo){
          console.log("Platform being added");
          //Generates new platform, sets it to platform being placed by opponent
          const userPlatform = new Platform(this, platformInfo.x, platformInfo.y, platformInfo.spriteKey, null, true);
          //Adds platform to both group and table
          userPlatform.sticky = true
          this.allPlatforms.add(userPlatform);
          this.input.setDraggable(userPlatform,false);
          this.platformTable[userPlatform.id] = userPlatform
    }

    updatePlatform(platformInfo){
      console.log("Platform being updated");
      this.platformTable[platformInfo.id].setPosition(platformInfo.x,platformInfo.y)
    }

    platformPlaced(platformInfo){
      console.log("Platform being placed");
      this.platformTable[platformInfo.id].alpha = 1.0;
    }

    onClicked(pointer, objectClicked) {

      if(this.allPlatforms.children.entries.includes(objectClicked) && this.removeButtonToggle && objectClicked.sticky === false){

        console.log('......onClicked', objectClicked)
        console.log('*******onClicked-table', this.platformTable)
        this.socket.emit('removePlatform', {id: objectClicked.id, platform: objectClicked})
        this.allPlatforms.remove(objectClicked);
        objectClicked.destroy();
        // this.platformTable[objectClicked.id].delete();
        delete this.platformTable[objectClicked.id];

        console.log('onClicked-table.......', this.platformTable)
        this.removeButtonToggle = false;
        this.platformDestroyer.clearTint();

      }
    }

    removePlatform(platform) {
      console.log('the other platform remove====++', platform.platform);
      console.log('the platformTable', this.allPlatforms);
      this.allPlatforms.remove(platform.platform);
      // platform.destroy();
      // this.platformTable[id].delete();
      // delete this.platformTable[id];

      console.log('+++++', this.allPlatforms);
      this.removeButtonToggle = false;
      this.platformDestroyer.clearTint();
    }

    removePlayer(id){
        console.log("Removing player with id:",id)
        this.otherPlayers[id].delete();
        delete this.otherPlayers[id];
    }

}
