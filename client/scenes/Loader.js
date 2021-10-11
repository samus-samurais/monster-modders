export default class InitialLoader extends Phaser.Scene {
    constructor() {
      super('InitialLoader');
    }
    init(data) {
      this.socket = data.socket;
    }

    preload(){
        //Loads basic sets
        this.load.image('sky', 'assets/sky.png');
        this.load.spritesheet('dude', 
        'assets/dude.png',
        { frameWidth: 32, frameHeight: 48 }
        );
      }

    create() {
      this.scene.stop('InitialLoader');
      this.scene.start('Prototype', { socket: this.socket });
    }
  }