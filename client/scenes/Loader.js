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
    this.load.spritesheet("dude", "assets/dude.png", {
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
    this.load.image("tutorialButton", "assets/testImage/falseLoginSignupButton.png"); //tutorial button
    this.load.image("sky", "assets/sky.png");
    this.load.image("star", "assets/star.png");
    this.load.image('background', 'assets/testImage/falseBackground.png');
    this.load.image('background', 'assets/testImage/falseBackground.png');
    this.load.image('platform', 'assets/platform/falseShortPlatform.png');
    this.load.image('fallDetector',"assets/outOfBounds.jpeg");
    this.load.image('addPlatformButton', 'assets/testImage/falseAddPlatformButton.png');
    this.load.image('falseRemovePlatformChangeButton', 'assets/testImage/falseRemovePlatformChangeButton.png');
    this.load.image('falseRemovePlatformButton', 'assets/testImage/falseRemovePlatformButton.png');
    this.load.image("backButton", "assets/testImage/backButton.png");


    //audio
    this.load.audio("lobbyMusic", "assets/audio/lobby-music.mp3");

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
