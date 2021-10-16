import Phaser from "phaser"
import Platform from "../sprites/Platform.js";
import Player from "../sprites/Player.js"
import FallDetector from "../sprites/FallDetector.js";

export default class Sandbox extends Phaser.Scene {
  constructor() {
    super("Sandbox");
    this.player = null;
    this.addButtonToggle = false;
    this.removeButtonToggle = false;
  }

  init(data){
    this.socket = data.socket;
    this.playerId = data.socket.id;
    this.playerInfo = data.user ? data.user : { username: 'guest' };
    console.log('check its a login user or guest--', this.playerInfo)
  }

  create() {
    const self = this
    this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);

    //Sets world such that players can go past top and bottom of screen, but not sides
    this.physics.world.setBoundsCollision(true,true,false,false);

    // create static platforms as begining and goal place.
    this.staticPlatforms = this.physics.add.staticGroup();
    this.staticPlatforms.create(200, 600, 'platform');
    this.staticPlatforms.create(1000, 200, 'platform');

    this.allPlatforms = this.add.group();

    this.platformMaker = this.add.image(100, 100, 'addPlatformButton').setInteractive();
    this.platformMaker.on('pointerdown', () => {
      this.addButtonToggle = true;
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
    const colliderInfo = {
      staticPlatforms: this.staticPlatforms,
      platforms: this.allPlatforms,
      fallDetector: this.fallDetector
    }
    this.player = new Player(this, 200, 535, 'dude', 'PC', null, this.playerInfo.username, colliderInfo)

    // create drag action
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    })

    //Sets up controls
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
  }

  update () {
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
}



