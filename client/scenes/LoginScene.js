import Phaser from 'phaser'

//User can log in or sign up here!

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
        //Redirects user to signup page if they want to create an account
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

    //Shows error if login info is faulty
    this.errorMessage = this.add.text(450, 600, "", { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '16px' })
    this.socket.on("userInfoNotValid", (error) => {
      this.errorMessage.setText(`${error}`)
    })

    //Launches user profile scene if login info is valid!
    this.socket.on("LoginSuccess", (user) => {
      this.scene.stop("LoginScene");
      this.scene.launch("UserProfileScene", {
        socket: this.socket,
        user: user,
        homeSceneUI: this.homeSceneUI
      })
      this.scene.stop("LoginScene");
    })

    //Lets us type with WASD keys, which are usually captured for player movement
    this.input.keyboard.on('keydown', function (event) {
      if(event.key == 'a'){
          this.element.getChildByName('nameField').value+=event.key;
        }else if(event.key == 's'){
          this.element.getChildByName('nameField').value+=event.key;
        }else if(event.key == 'd'){
          this.element.getChildByName('nameField').value+=event.key;
        }else if(event.key == 'w'){
          this.element.getChildByName('nameField').value+=event.key;
        }
    }.bind(this));

    //BACK BUTTON SORCERY
    this.goBack();
  }

  //Makes a back button lol
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
