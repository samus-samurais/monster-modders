import Phaser from "phaser"
import Player from "../sprites/Player.js"

export default class Sandbox extends Phaser.Scene {
  constructor() {
    super("Sandbox");
  }

  init(data){
    this.socket = data.socket;
    this.playerId = data.socket.id;
    this.playerInfo = data.user;
    console.log('check its a login user or guest', this.player)
  }

  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('platform', 'assets/platform/falsePlatform.png');
    // this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 })
  }

  create() {
    const self = this;

    this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);

    // this.socket.emit('playerJoined');
    // this.socket.on('sentPlayerInfo', function (players, scene = self) {
    //     scene.addPlayers(players);
    // });

    // this.player = this.physics.add.sprite(50, 550, 'dude')
    // this.player.setCollideWorldBounds(true);

    this.platform = this.add.image(200, 600, 'platform')
    this.platform.setInteractive({ draggable: true, dropZone: true })

    this.platform.on('dragstart', (pointer, dragX, dragY) => {
      console.log('/////')
      this.platform.x = dragX;
      this.platform.y = dragY;
    })
    this.platform.on('drag', (pointer, dragX, dragY) => {
      console.log('?????')
      this.platform.x = dragX;
      this.platform.y = dragY;
    })
    this.platform.on('dragend', (pointer, dragX, dragY) => {
      this.platform.x = dragX;
      this.platform.y = dragY;
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
