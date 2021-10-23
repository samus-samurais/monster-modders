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
    this.platformMaker = null;
    this.platformDestroyer = null;
    this.platformBeingPlaced = null
  }

  init(data){
    this.socket = data.socket;
    this.playerId = data.socket.id;
    this.playerInfo = data.user ? data.user : { username: "guest"};
    console.log('check its a login user or guest--', this.playerInfo)
  }

  create() {
    const self = this
    this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);

    //play sandbox mode music
    this.sandboxMusic = this.sound.add("sandboxMusic");
    this.sandboxMusic.play({volume: 0.2, loop: true});

    //Sets world such that players can go past top and bottom of screen, but not sides
    this.physics.world.setBoundsCollision(true,true,false,false);

    // create static platforms as begining and goal place.
    this.staticPlatforms = this.physics.add.staticGroup();
    this.staticPlatforms.create(200, 600, 'platform');
    this.staticPlatforms.create(1000, 200, 'platform');

    this.allPlatforms = this.add.group();

    this.platformMaker = this.add.image(100, 100, 'addPlatformButton').setInteractive();
    this.platformMaker.on('pointerdown', () => {
      //In sandbox mode, platforms are given no socket and a generic ID to ensure they are always 'sticky' and emit nothing
      const userPlatform = new Platform(self, this.input.mousePointer.x, this.input.mousePointer.y, "platform", null, "single player");
      this.allPlatforms.add(userPlatform);
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

    //Drops off sticky platforms upon click
    this.input.on('pointerup',() => {
      if(this.platformBeingPlaced && this.platformBeingPlaced.sticky){
        this.platformBeingPlaced.place();
      }
    })

    //Sets up controls
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.goBack();
  }

  update () {
    if(this.player){
      this.player.update(this.cursors);
    }

    if(this.platformBeingPlaced){
      this.platformBeingPlaced.update(this.input.mousePointer);
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
      this.sandboxMusic.stop();
      this.scene.start("HomeScene", {socket: this.socket, user: this.playerInfo});
    })
  }
}



