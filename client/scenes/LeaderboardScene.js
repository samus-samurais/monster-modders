import Phaser from "phaser";

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('LeaderboardScene');
    this.leaderboardInfo = null;
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

    this.socket.emit('leaderboard');

    this.socket.on('leaderboardInfo', (leaderboardArr) => {
      this.leaderboardInfo = leaderboardArr;
      this.leaderboard();
      console.log('frond end leaderboard Arr is ======', this.leaderboardInfo);
    })

    this.usersUsername = this.add.text(400, 50, `Player Username`, { color: 'white', fontFamily: 'Arial', fontSize: '32px '});
    this.usersWins = this.add.text(700, 50, `Player Wins`, { color: 'white', fontFamily: 'Arial', fontSize: '32px '});
    this.goBack();
  }

  leaderboard() {
    if (this.leaderboardInfo) {
      // display top 10 users' information
      for (let i=0; i < this.leaderboardInfo.length; i++) {
        if (i <= 2) {
          this.add.image(430, i * 60 + 135, `top${i + 1}`)
        }
        this.add.text(480, i * 60 + 110, `${this.leaderboardInfo[i].username}`, { color: 'white', fontFamily: 'Arial', fontSize: '26px '});
        this.add.text(780, i * 60 + 110, `${this.leaderboardInfo[i].number_of_wins}`, { color: 'white', fontFamily: 'Arial', fontSize: '26px '});
      }
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
