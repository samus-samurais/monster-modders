import Phaser from "phaser";

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super("TutorialScene");
  }

  init(data) {
    this.socket = data.socket;
    this.homeSceneUI = data.homeSceneUI;
  }

  create() {
    //Disables the Home Scene UI
    this.homeSceneUI.children.iterate((child) => {
      child.disableInteractive();
      child.visible = false;
    });

    this.tutorialHTML = this.add.dom(640, 360).createFromCache("tutorialtext");
    
    this.goBack();
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
      this.scene.stop("TutorialScene");
    });
  }
}
