import Phaser from "phaser"
import Platform from "../sprites/platform.js";
import Player from "../sprites/Player.js"

export default class Sandbox extends Phaser.Scene {
  constructor() {
    super("Sandbox");
    this.player = null;
  }

  init(data){
    this.socket = data.socket;
    this.playerId = data.socket.id;
    this.playerUsername = data.user ? data.user.username : 'guest';
    console.log('check its a login user or guest--', this.playerUsername)
  }

  preload() {
    this.load.image('platform', 'assets/platform/falseShortPlatform.png');
  }

  create() {
    const self = this
    this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);

    // create static platforms as begining and goal place.
    this.staticPlatforms = this.physics.add.staticGroup();
    this.staticPlatforms.create(200, 600, 'platform');
    this.staticPlatforms.create(1000, 200, 'platform');

    //Creates player, adds collider between player and platforms
    this.player = new Player(this, 200, 550, 'dude', 'PC', null, this.playerUsername, this.platform, this.staticPlatform)
    this.physics.add.collider(this.player, this.staticPlatforms);


    //platformMaker = this.physics.add.image(100,100,'sandboxButton').setInteractive();
    //userPlatforms = this.physics.add.group();


    //platformMaker.on('pointerdown', (pointer) => {
    //  userPlatforms.add(new Platform(self,pointer.x,pointer.y,"platform"));
    //})
    // create the platforms for player to choose and drag
    /*
    this.platform = this.physics.add.image(200, 200, 'platform').setImmovable(true);
    this.platform.body.setAllowGravity(false);
    this.platform.setInteractive({ draggable: true })

    this.input.setDraggable(this.platform);
    */

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

  update (){
    if(this.player){
      this.player.update(this.cursors);
    }
  }



}
