import Phaser from "phaser"
import Platform from "../sprites/Platform.js";
import Player from "../sprites/Player.js"
import FallDetector from "../sprites/FallDetector.js";

//A single player mode where players can add or remove as many platforms as they see fit! 
//In this mode, players can move their character and place platforms at the same time
//They can also move around platforms that have already been placed here

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
  }

  create() {

    this.sound.stopAll(); //stop lobby music

    const self = this
    //Initializes game map
    this.add.image(640, 368, 'GameMapFinal')
    this.add.image(40, 608, 'door')
    this.add.image(1252, 354, 'door')

    //play sandbox mode music
    this.sandboxMusic = this.sound.add("sandboxMusic");
    this.sandboxMusic.play({volume: 0.2, loop: true});

    //Sets world such that players can go past top and bottom of screen, but not sides
    this.physics.world.setBoundsCollision(true,true,false,false);

    // create static platforms at start and finish.
    this.staticPlatforms = this.physics.add.staticGroup();
    this.staticPlatforms.create(64, 642, 'staticPlatformStartLine');
    this.staticPlatforms.create(1230, 386, 'staticPlatformFinishLineRightSize');
    this.staticPlatforms.create(1200, 386, 'staticPlatformFinishLineRightSize');

    //Sets up group to hold all non-static platforms
    this.allPlatforms = this.add.group();


    //Initializes add platform button
    this.platformMaker = this.add.image(100, 50, 'addPlatformButton').setScale(0.5).setInteractive();
    this.platformMaker.on('pointerdown', () => {
      //In sandbox mode, platforms are given no socket and a generic "single player" ID to ensure they are always 'sticky' and emit nothing
      const userPlatform = new Platform(self, this.input.mousePointer.x, this.input.mousePointer.y, "broomplatform", null, "single player");
      this.allPlatforms.add(userPlatform);
      this.input.setDraggable(userPlatform);
      this.platformBeingPlaced = userPlatform
    });

    //Initializes remove platform button
    this.platformDestroyer = this.add.image(256, 50, "falseRemovePlatformButton").setScale(0.5).setInteractive();
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
    this.player = new Player(this, 96, 535, 'zombiesprite', 'PC', null, this.playerInfo.username, colliderInfo)

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

    //Since this is a single player mode with no end state, it gets a back button! Yay!
    this.goBack();
  }

  update () {
    //Handles player movement
    if(this.player){
      this.player.update(this.cursors);
    }

    //Handles platform movement
    if(this.platformBeingPlaced){
      this.platformBeingPlaced.update(this.input.mousePointer);
    }

    //Handles add button state (more on that in GameScene)
    if (this.allPlatforms.children.entries.length) {
      this.addButtonToggle = true;
    } else {
      this.addButtonToggle = false;
    }

  }

  //Handles platform removal, exclusively called through removeplatform button
  onClicked(pointer, objectClicked) {
    if(this.allPlatforms.children.entries.includes(objectClicked) && this.removeButtonToggle){
      this.allPlatforms.remove(objectClicked);
      objectClicked.destroy();
      this.removeButtonToggle = false;
      this.platformDestroyer.clearTint();
    }
  }

  //Lets player exit Sandbox when they are done
  //(If I come back to this: Upon finishing a game while logged in, somehow playerInfo gets garbled at some point and the back button breaks)
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



