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
    }

    create(){
        const self = this;
        //Initializes player
        this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);
        this.socket.emit('playerJoined');

        //Gets info from server to load self and existing players
        this.socket.on('sentPlayerInfo', function (players, scene = self) {
            scene.addPlayers(players);
        });

        //Adds new player if player joins
        this.socket.on('newPlayer', function (newPlayer, scene = self) {
            scene.addNewPlayer(newPlayer);
        });

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

        // this.socket.on('updatePlayerPlatforms', function (colliderInfo, scene = self) {
        //   if (scene.otherPlayers[colliderInfo.playerId]) {
        //     console.log('...updatePlayerPlatform', colliderInfo)
        //   }
        // })

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

    // create drag action
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    })

    //Generates "Fall Detector" sprite to signal when player has fallen off lower end of the map
    this.fallDetector = new FallDetector(this,this.socket);

    //Creates player, adds collider between player and platforms
    this.colliderInfo = {
      staticPlatforms: this.staticPlatforms,
      platforms: this.allPlatforms,
      fallDetector: this.fallDetector
    }

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

    addPlayers(players){
        console.log("Players object: ",players);
        console.log("Socket: ",this.socket);
        let ids = Object.keys(players);
        for(let i = 0; i < ids.length; i++){
            if(ids[i] === this.playerId){
                console.log("Match found!"); //PC == Playable Character!
                this.player = new Player(this, players[ids[i]].x,players[ids[i]].y, 'dude', 'PC', this.socket, players[ids[i]].username, this.colliderInfo)
            } else {
                console.log("Different player"); //NPC = Non-playable Character
                this.otherPlayers[ids[i]] = new Player(this, players[ids[i]].x, players[ids[i]].y, 'dude','NPC', null, players[ids[i]].username)

            }
        }

    }

    addNewPlayer(player){
        console.log("Updating scene with new player:", player);
        this.otherPlayers[player.playerId] = new Player(this, player.x, player.y, 'dude','NPC', null, player.username)
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
