import Phaser from 'phaser'

export default class UserProfileScene extends Phaser.Scene {
  constructor() {
    super('UserProfileScene')
  }

  init(data) {
    this.socket = data.socket;
    this.playerInfo = data.user;
  }

  create() {
    this.add.image(640, 360, 'background');

    // display login user's information
    this.username = this.add.text(450, 150, `Player username: ${this.playerInfo.username}`, { color: 'white', fontFamily: 'Arial', fontSize: '32px '});

    this.email = this.add.text(450, 250, `Player email: ${this.playerInfo.email}`, { color: 'white', fontFamily: 'Arial', fontSize: '32px '});

    this.numberOfWins = this.add.text(450, 350, `Player wins: ${this.playerInfo.number_of_wins}`, { color: 'white', fontFamily: 'Arial', fontSize: '32px '});

    // navigate to the game different modes button
    this.sandboxButton = this.add.image(445, 540, 'sandboxButton').setInteractive();
    this.sandboxButton.on('pointerdown', () => {
      this.scene.start('Sandbox', {socket: this.socket, user: this.playerInfo});
      this.sandboxButton.disableInteractive();
    });

    this.multiplayerButton = this.add.image(765, 540, 'multiplayerButton').setInteractive();
    this.multiplayerButton.on('pointerdown', () => {
      this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo});
      this.multiplayerButton.disableInteractive();
    })

  }
}
