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
    this.UI = this.add.group();

    // display login user's information
    this.username = this.add.text(450, 150, `Player username: ${this.playerInfo.username}`, { color: 'white', fontFamily: 'Arial', fontSize: '32px '});
    this.UI.add(this.username);

    this.email = this.add.text(450, 250, `Player email: ${this.playerInfo.email}`, { color: 'white', fontFamily: 'Arial', fontSize: '32px '});
    this.UI.add(this.email);

    // navigate to the game different modes button
    this.sandboxButton = this.add.image(445, 540, 'sandboxButton').setInteractive();
    this.sandboxButton.on('pointerdown', () => {
      this.scene.start('Sandbox', {socket: this.socket, user: this.playerInfo, prevSceneUI: this.UI});
      this.sandboxButton.disableInteractive();
    });
    this.UI.add(this.sandboxButton);

    this.multiplayerButton = this.add.image(765, 540, 'multiplayerButton').setInteractive();
    this.multiplayerButton.on('pointerdown', () => {
      this.scene.launch('RoomSelector',{socket: this.socket, user: this.playerInfo, prevSceneUI: this.UI});
      this.multiplayerButton.disableInteractive();
    })
    this.UI.add(this.multiplayerButton);

    this.goBack();

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
      this.scene.stop("UserProfileScene");
      this.scene.start("HomeScene", {socket: this.socket, user: this.playerInfo});
    })
  }
}
