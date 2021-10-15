import Phaser from "phaser"
import Platform from "../sprites/Platform.js";
import Player from "../sprites/Player.js"

export default class Sandbox extends Phaser.Scene {
  constructor() {
    super("Sandbox");
    this.player = null;
  }

  init(data){
    this.socket = data.socket;
    this.playerId = data.socket.id;
    this.playerInfo = data.user ? data.user : { username: 'guest' };
    console.log('check its a login user or guest--', this.playerInfo)
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

    this.allPlatforms = this.add.group();
    this.allPlatforms.children.iterate(function (child) {
      child.setAllowGravity(false)
    });

    this.platformMaker = this.add.image(100, 100, 'sandboxButton').setInteractive();
    this.platformMaker.on('pointerdown', () => {
      this.userPlatforms = new Platform(self, 300, 100, "platform", null);
      this.allPlatforms.add(this.userPlatforms);
      this.input.setDraggable(this.userPlatforms);
    })

    //Creates player, adds collider between player and platforms
    this.player = new Player(this, 200, 550, 'dude', 'PC', null, this.playerInfo, this.allPlatforms, this.staticPlatforms)

    // put the username above the player
    this.username = this.add.text(this.player.x, this.player.y - 10, `${this.playerInfo.username}`, { color: 'purple', fontFamily: 'Arial', fontSize: '16px '});

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

    this.goBack();
  }

  update (){
    if(this.player){
      this.player.update(this.cursors);

      // make the username move follow the player
      this.username.x = this.player.body.position.x;
      this.username.y = this.player.body.position.y - 10;
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
    backButton.on("pointerup", () => {
      this.scene.stop("Sandbox");
      this.scene.start("HomeScene");
    })
  }
}



