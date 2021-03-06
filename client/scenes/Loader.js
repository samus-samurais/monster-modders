import WebFontFile from '../../public/webfont';

//Loads ALL THE THINGS
//This preloads all necessary assets beforehand to keep our game running smoothly
//Also comes with loading bar! :D

export default class InitialLoader extends Phaser.Scene {
  constructor() {
    super("InitialLoader");
  }
  init(data) {
    this.socket = data.socket;
  }

  preload() {
    this.load.addFile(new WebFontFile(this.load, 'Press Start 2P'))

    this.graphics = this.add.graphics();
    this.newGraphics = this.add.graphics();
    var progressBar = new Phaser.Geom.Rectangle(470, 280, 400, 50);
    var progressBarFill = new Phaser.Geom.Rectangle(475, 285, 290, 40);

    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillRectShape(progressBar);

    this.newGraphics.fillStyle(0x3587e2, 1);
    this.newGraphics.fillRectShape(progressBarFill);


    const loadingText = this.add.text(475, 340, "Loading: ", {
      fontSize: "24px",
      fill: "#FFF",
    });

    //Loads basic sets
    this.load.spritesheet("zombiesprite", "assets/playerSprites/zombiesprite.png", {
      frameWidth: 32,
      frameHeight: 48,
    });

    //images
    this.load.image('background', 'assets/testImage/falseBackgroundRightSize.png');
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
    this.load.image('platform', 'assets/platform/falseShortPlatform.png');
    this.load.image('fallDetector',"assets/outOfBounds.jpeg");
    this.load.image('addPlatformButton', 'assets/testImage/falseAddPlatformButton.png');
    this.load.image('falseRemovePlatformChangeButton', 'assets/testImage/falseRemovePlatformChangeButton.png');
    this.load.image('falseRemovePlatformButton', 'assets/testImage/falseRemovePlatformButton.png');
    this.load.image("backButton", "assets/testImage/backButton.png");
    this.load.image("GameMapFinal", "assets/backgrounds/Gamemap.png")
    this.load.image("LobbymapFinal", "assets/backgrounds/LobbymapFinal.png")
    this.load.image("leaveRoomButton", "assets/testImage/falseLeaveRoomButton.png");
    this.load.image("leaderboardButton", "assets/testImage/falseLeaderboardButton.png");
    this.load.image("top1", "assets/testImage/falseTop1.png");
    this.load.image("top2", "assets/testImage/falseTop2.png");
    this.load.image("top3", "assets/testImage/falseTop3.png");
    this.load.image("broomplatform", "assets/platform/broomplatform.png");
    this.load.image("door", "assets/platform/door.png");
    this.load.image("staticPlatformStartLine", "assets/platform/staticPlatformStartLine.png");
    this.load.image("staticPlatformFinishLineRightSize", "assets/platform/staticPlatformFinishLineRightSize.png");
    this.load.image("lobbyStaticPlatform1", "assets/platform/lobbyStaticPlatform1.png");
    this.load.image("lobbyStaticPlatform2", "assets/platform/lobbyStaticPlatform2.png");
    this.load.image("lobbyStaticPlatform3", "assets/platform/lobbyStaticPlatform3.png");
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
    this.load.image("lobbyStaticPlatformDown", "assets/platform/lobbyStaticPlatformDown.png");

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
  }

  //Fills up bar as things load
  updateBar(percentage) {
    this.newGraphics.clear();
    this.newGraphics.fillStyle(0x3587e2, 1);
    this.newGraphics.fillRectShape(new Phaser.Geom.Rectangle(475, 285, percentage * 390, 40));

    percentage = percentage * 100;
    this.loadingText.setText("Loading: " + percentage.toFixed(2) + "%");
  }

  create() {
    this.scene.stop("InitialLoader");
    this.scene.start("HomeScene", { socket: this.socket });
  }
}
