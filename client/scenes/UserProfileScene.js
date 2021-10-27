import Phaser from 'phaser'

//An alternate main menu of sorts
//From here, users can look at their profile information
//They can also start a Sandbox or multiplayer game here

export default class UserProfileScene extends Phaser.Scene {
  constructor() {
    super('UserProfileScene')
  }

  init(data) {
    this.socket = data.socket;
    this.playerInfo = data.user;
    this.homeSceneUI = data.homeSceneUI;
  }

  create() {
    //Disables the Home Scene UI
    this.homeSceneUI.children.iterate((child) => {
      child.disableInteractive();
      child.visible = false;
    });
    //Sets up another instance of this.UI, since you are allowed to go back and forth between the userProfile scene and the RoomSelector
    this.UI = this.add.group();

    // display login user's information
    this.username = this.add.text(400, 150, `Player username: ${this.playerInfo.username}`, { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '20px' });
    this.UI.add(this.username);

    this.email = this.add.text(400, 250, `Player email: ${this.playerInfo.email}`, { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '20px' });
    this.UI.add(this.email);

    this.numberOfWins = this.add.text(400, 350, `Player wins: ${this.playerInfo.number_of_wins}`, { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '20px' });
    this.UI.add(this.numberOfWins);

    // navigate to the game different modes button
    this.sandboxButton = this.add.image(445, 540, 'sandboxButton').setInteractive();
    this.sandboxButton.on('pointerdown', () => {
      this.scene.start('Sandbox', {socket: this.socket, user: this.playerInfo, prevSceneUI: this.UI});
    });
    this.UI.add(this.sandboxButton);

    this.multiplayerButton = this.add.image(765, 540, 'multiplayerButton').setInteractive();
    this.multiplayerButton.on('pointerdown', () => {
      this.scene.launch('RoomSelector',{socket: this.socket, user: this.playerInfo, prevSceneUI: this.UI});
    })
    this.UI.add(this.multiplayerButton);

    //Back button stuff. See: LITERALLY EVERY OTHER UI SCENE
    this.goBack();

  }

  //I DONT LIKE IT I WANNA GO BAAAAACCCKKK (initializes the button to do this)
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
      this.homeSceneUI.children.iterate((child) => {
        child.setInteractive();
        child.visible = true;
      });
      this.scene.stop("UserProfileScene");
      this.scene.launch("HomeScene", {socket: this.socket, user: this.playerInfo})
    })
  }
}
