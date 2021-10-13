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
    var progressBar = new Phaser.Geom.Rectangle(200, 200, 400, 50);
    var progressBarFill = new Phaser.Geom.Rectangle(205, 205, 290, 40);

    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillRectShape(progressBar);

    this.newGraphics.fillStyle(0x3587e2, 1);
    this.newGraphics.fillRectShape(progressBarFill);

    var loadingText = this.add.text(250, 260, "Loading: ", {
      fontSize: "32px",
      fill: "#FFF",
    });
    //Loads basic sets
    this.load.image("sky", "assets/sky.png");
    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });

    //audio
    this.load.audio("lobbyMusic", "assets/audio/lobby-music.mp3");

    this.load.on("progress", this.updateBar, {
      newGraphics: this.newGraphics,
      loadingText: loadingText,
    });
    this.load.on("complete", this.complete, {scene: this.scene});
  }

  updateBar(percentage) {
    this.newGraphics.clear();
    this.newGraphics.fillStyle(0x3587e2, 1);
    this.newGraphics.fillRectShape(new Phaser.Geom.Rectangle(205, 205, percentage * 390, 40));

    percentage = percentage * 100;
    this.loadingText.setText("Loading: " + percentage.toFixed(2) + "%");
    console.log("%: " + percentage);
  }

  complete() {
    console.log("COMPLETE");
    this.scene.stop("InitialLoader"); //necessary?
    this.scene.start("HomeScene", { socket: this.socket });
  }

  // create() {
  //   
    
  // }
}
