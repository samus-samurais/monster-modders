import Phaser from "phaser";

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('LeaderboardScene');
    this.loadingText = null;
  }

  init(data) {
    this.socket = data.socket;
    this.playerInfo = data.user ? data.user : null;
    this.homeSceneUI = data.homeSceneUI;
  }

  create(){
    //Disables the Home Scene UI
    this.homeSceneUI.children.iterate((child) => {
      child.disableInteractive();
      child.visible = false;
    });

    this.rectangleBackground = this.add.rectangle(640, 360, 520, 680, 0x009AA8);
    this.tweens.add({
      targets: this.rectangleBackground,
      alpha: 0.8,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.loadingText = this.add.text(480, 300, 'info is loading...', { color: '#ffc93c', fontFamily: '"Press Start 2P"', fontSize: '20px'})

    this.socket.emit('leaderboard');

    this.socket.on('leaderboardInfo', (leaderboardArr) => {
      this.leaderboard(leaderboardArr);
      console.log('frond end leaderboard Arr is:', leaderboardArr);
    })

    this.goBack();
  }

  leaderboard(leaderboardArr) {
    this.loadingText.destroy();
    this.usersUsername = this.add.text(420, 50, `Player Username`, { color: '#ffc93c', fontFamily: '"Press Start 2P"', fontSize: '20px'});
    this.usersWins = this.add.text(750, 50, `Wins`, { color: '#ffc93c', fontFamily: '"Press Start 2P"', fontSize: '20px'});
    // display top 10 users' information
    for (let i=0; i < leaderboardArr.length; i++) {
      if (i <= 2) {
        this.add.image(470, i * 60 + 135, `top${i + 1}`)
      }
      this.add.text(520, i * 60 + 110, `${leaderboardArr[i].username}`, { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '16px'});
      this.add.text(780, i * 60 + 110, `${leaderboardArr[i].number_of_wins}`, { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '16px'});
    }
  }

  goBack() {
    const backButton = this.add
      .image(this.scale.width - 20, 20, "backButton")
      .setScrollFactor(0)
      .setOrigin(1, 0)
      .setScale(2);
    backButton.setInteractive();
    backButton.on("pointerdown", () => {
      backButton.setTint(0xff0000);
    });
    backButton.on("pointerover", () => {
      backButton.setTint(0xff0000);
    });
    backButton.on("pointerout", () => {
      backButton.clearTint();
    });
    backButton.on("pointerup", () => {
      this.homeSceneUI.children.iterate((child) => {
        child.setInteractive();
        child.visible = true;
      });
      this.scene.stop("LeaderboardScene");
    });
  }
}
