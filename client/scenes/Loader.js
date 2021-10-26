export default class InitialLoader extends Phaser.Scene {
  constructor() {
    super("InitialLoader");
  }
  init(data) {
    this.socket = data.socket;
  }

  preload() {
    this.graphics = this.add.graphics();
    this.newGraphics = this.add.graphics();
    var progressBar = new Phaser.Geom.Rectangle(470, 280, 400, 50);
    var progressBarFill = new Phaser.Geom.Rectangle(475, 285, 290, 40);

    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillRectShape(progressBar);

    this.newGraphics.fillStyle(0x3587e2, 1);
    this.newGraphics.fillRectShape(progressBarFill);


    const loadingText = this.add.text(500, 340, "Loading: ", {
      fontSize: "32px",
      fill: "#FFF",
    });

    //Loads basic sets
    this.load.spritesheet("zombiesprite", "assets/playerSprites/zombiesprite.png", {
      frameWidth: 32,
      frameHeight: 48,
    });

    //images
    this.load.image('background', 'assets/testImage/falseBackground.png');
    this.load.image('logo', 'assets/testImage/falseLogo.png');
    this.load.image('sandboxButton', 'assets/testImage/falseSandboxButton.png');
    this.load.image('multiplayerButton', 'assets/testImage/falseMultiplayerButton.png');
    this.load.image('loginSignupButton', 'assets/testImage/falseLoginSignupButton.png');
    this.load.image('playerInfoButton', 'assets/testImage/falsePlayerInfoButton.png');
    this.load.image('tutorialButton', 'assets/testImage/falseTutorialButton.png');
    this.load.image("sky", "assets/sky.png");
    this.load.image("finishLine", "assets/finishLine.png");
    this.load.image("cursor", "assets/cursor.png");
    this.load.image("startLine", "assets/startLine.png");
    this.load.image('background', 'assets/testImage/falseBackground.png');
    this.load.image('background', 'assets/testImage/falseBackground.png');
    this.load.image('platform', 'assets/platform/falseShortPlatform.png');
    this.load.image('fallDetector',"assets/outOfBounds.jpeg");
    this.load.image('addPlatformButton', 'assets/testImage/falseAddPlatformButton.png');
    this.load.image('falseRemovePlatformChangeButton', 'assets/testImage/falseRemovePlatformChangeButton.png');
    this.load.image('falseRemovePlatformButton', 'assets/testImage/falseRemovePlatformButton.png');
    this.load.image("backButton", "assets/testImage/backButton.png");
    this.load.image("GamemapScreenshot", "assets/backgrounds/GamemapScreenshot.png")
    this.load.image("LobbymapScreenshot", "assets/backgrounds/LobbymapScreenshot.png")
    this.load.image("leaveRoomButton", "assets/testImage/falseLeaveRoomButton.png");
    this.load.image("leaderboardButton", "assets/testImage/falseLeaderboardButton.png");
    this.load.image("top1", "assets/testImage/falseTop1.png");
    this.load.image("top2", "assets/testImage/falseTop2.png");
    this.load.image("top3", "assets/testImage/falseTop3.png");
    this.load.image("broomplatform", "assets/platform/broomplatform.png");
    this.load.image("Room1Button", "assets/buttons/Room1Button.png");
    this.load.image("room2Button", "assets/buttons/room2Button.png");
    this.load.image("room3Button", "assets/buttons/room3Button.png");
    this.load.image("room4Button", "assets/buttons/room4Button.png");
    this.load.image("room5Button", "assets/buttons/room5Button.png");
    this.load.image("room6Button", "assets/buttons/room6Button.png");
    this.load.image("room7Button", "assets/buttons/room7Button.png");
    this.load.image("room8Button", "assets/buttons/room8Button.png");
    this.load.image("room9Button", "assets/buttons/room9Button.png");
    this.load.image("startButton", "assets/buttons/Start.png");


    //audio
    this.load.audio("lobbyMusic", "assets/audio/lobby-music.mp3");
    this.load.audio("sandboxMusic", "assets/audio/game-music-1.wav");
    this.load.audio("gameMusic", "assets/audio/game-music-6.wav");
    this.load.audio("waitingMusic", "assets/audio/game-music-5.wav");
    this.load.audio("deathSound", "assets/audio/death-sound.wav");

    //html
    this.load.html('loginform', 'assets/text/loginform.html');
    this.load.html('signupform', 'assets/text/signupform.html');
    this.load.html("tutorialtext", "assets/text/tutorialtext.html");

    this.load.on("progress", this.updateBar, {
      newGraphics: this.newGraphics,
      loadingText: loadingText,
    });
    this.load.on("complete", this.complete, {scene: this.scene});
  }

  updateBar(percentage) {
    this.newGraphics.clear();
    this.newGraphics.fillStyle(0x3587e2, 1);
    this.newGraphics.fillRectShape(new Phaser.Geom.Rectangle(475, 285, percentage * 390, 40));

    percentage = percentage * 100;
    this.loadingText.setText("Loading: " + percentage.toFixed(2) + "%");
    console.log("%: " + percentage);
  }

  complete() {
    console.log("COMPLETE");
  }

  create() {
    this.scene.stop("InitialLoader");
    this.scene.start("HomeScene", { socket: this.socket });
  }
}
