import Phaser from "phaser"
import Platform from "../sprites/Platform.js";
import Player from "../sprites/Player.js"
import FallDetector from "../sprites/FallDetector.js";

export default class MultiplayerTest extends Phaser.Scene {
    constructor(key) {
        super(key);
        this.player = null
        this.otherPlayers = {}
        this.addButtonToggle = false;
        this.removeButtonToggle = false;
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
          this.userPlatforms = new Platform(self, 300, 100, "platform", null);
          this.allPlatforms.add(this.userPlatforms);
          this.input.setDraggable(this.userPlatforms);
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

        //Generates "Fall Detector" sprite to signal when player has fallen off lower end of the map
        this.fallDetector = new FallDetector(this,this.socket);

        //Creates player, adds collider between player and platforms
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

    }

    update() {
        if(this.player){
            this.player.update(this.cursors);
        }

        if (this.allPlatforms.children.entries.length) {
          this.addButtonToggle = true;
        } else {
          this.addButtonToggle = false;
        }
    }

    onClicked(pointer, objectClicked) {
      if(this.allPlatforms.children.entries.includes(objectClicked) && this.removeButtonToggle){
        this.allPlatforms.remove(objectClicked);
        objectClicked.destroy();
        this.removeButtonToggle = false;
        this.platformDestroyer.clearTint();
      }
    }

    removePlayer(id){
        console.log("Removing player with id:",id)
        this.otherPlayers[id].delete();
        delete this.otherPlayers[id];
    }

    goBack() {
      const backButton = this.add
        .image(this.scale.width - 20, 20, 'backButton')
        .setScrollFactor(0)
        .setOrigin(1, 0)
        .setScale(2);
      backButton.setInteractive();
      backButton.on("pointerdown", () => {
        backButton.setTint(0xFF0000);
      });
      backButton.on("pointerover", () => {
        backButton.setTint(0xFF0000);
      });
      backButton.on("pointerout", () => {
        backButton.clearTint();
      })
      backButton.on("pointerup", () => {
        this.scene.stop("Sandbox");
        this.scene.start("HomeScene");
      })
    }
}
