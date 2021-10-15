import Phaser from 'phaser'

export default class UserProfileScene extends Phaser.Scene {
  constructor() {
    super('UserProfileScene')
  }

  init(data) {
    this.socket = data.socket;
    this.player = data.user;
  }

  create() {
    this.add.image(640, 360, 'background');

    // display login user's information
    this.username = this.add.text(450, 150, `Player username: ${this.player.username}`, { color: 'white', fontFamily: 'Arial', fontSize: '32px '});

    this.email = this.add.text(450, 250, `Player email: ${this.player.email}`, { color: 'white', fontFamily: 'Arial', fontSize: '32px '});

    this.numberOfWins = this.add.text(450, 350, `Player wins: ${this.player.number_of_wins}`, { color: 'white', fontFamily: 'Arial', fontSize: '32px '});

    // navigate to the game different modes button
    this.sandboxButton = this.add.image(445, 540, 'sandboxButton').setInteractive();
    this.sandboxButton.on('pointerdown', () => {
      this.scene.start('Sandbox', {socket: this.socket, user: this.player});
      this.sandboxButton.disableInteractive();
    });

    this.multiplayerButton = this.add.image(765, 540, 'multiplayerButton').setInteractive();
    this.multiplayerButton.on('pointerdown', () => {
      this.scene.start('Prototype', {socket: this.socket});
      this.multiplayerButton.disableInteractive();
    })

  }
}
