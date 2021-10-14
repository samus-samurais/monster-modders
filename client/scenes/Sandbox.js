import Phaser from "phaser"
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
    this.load.image('sky', 'assets/sky.png');
    this.load.image('platform', 'assets/platform/falseShortPlatform.png');
  }

  create() {

    this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);

    // create static platfrom as begining and goal place.
    this.staticPlatform = this.physics.add.staticGroup();
    this.staticPlatform.create(200, 600, 'platform');
    this.staticPlatform.create(1000, 200, 'platform');

    // create the platforms for player to choose and drag
    this.platform = this.physics.add.image(200, 200, 'platform').setImmovable(true);
    this.platform.body.setAllowGravity(false);
    this.platform.setInteractive({ draggable: true })

    this.input.setDraggable(this.platform);

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    })

    // add new arguments in to the Player class
    this.player = new Player(this, 200, 550, 'dude', 'PC', null, this.playerUsername, this.platform, this.staticPlatform)

  }


}
