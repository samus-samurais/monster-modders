import Phaser from 'phaser'

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene')
  }

  init(data) {
    this.socket = data.socket
    this.homeSceneUI = data.homeSceneUI
  }

  create() {
    //Disables the Home Scene UI
    this.homeSceneUI.children.iterate((child) => {
      child.disableInteractive()
      child.visible = false;
    })
    this.inputElementLogin = this.add.dom(640, 360).createFromCache("loginform");
    this.inputElementLogin.addListener('click');
    this.inputElementLogin.on('click', (event) => {
      //Prevents our form from refreshing the page
      event.preventDefault();
      if (event.target.name === 'loginButton') {
        const email = this.inputElementLogin.getChildByName('email').value;
        const password = this.inputElementLogin.getChildByName('password').value;

        //Emits a signal to our server denoting that a user has logged in
        this.socket.emit("userLogin", {
          email,
          password
        })
      } else if (event.target.name === 'createAccountButton') {
        this.scene.stop("LoginScene");
        this.scene.launch("SignupScene", {socket: this.socket, homeSceneUI: this.homeSceneUI})
      } else if (event.target.name === 'cancel') {
        //Re-enables the Home Scene UI
        this.homeSceneUI.children.iterate((child) => {
          child.setInteractive()
          child.visible = true;
        })
        this.scene.stop("LoginScene");
      }
    })

    this.errorMessage = this.add.text(450, 600, "", { color: 'white', fontFamily: 'Arial', fontSize: '32px '})
    this.socket.on("userInfoNotValid", (error) => {
      this.errorMessage.setText(`${error}`)
    })

    this.socket.on("LoginSuccess", (user) => {
      this.scene.stop("LoginScene");
      this.scene.launch("UserProfileScene", {
        socket: this.socket,
        user: user,
        homeSceneUI: this.homeSceneUI
      })
      this.scene.stop("LoginScene");
    })

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
      this.homeSceneUI.children.iterate((child) => {
        child.setInteractive()
        child.visible = true;
      })
      this.scene.stop("LoginScene");
    })
  }
}
