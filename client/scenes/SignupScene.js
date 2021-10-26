import Phaser from 'phaser'

//Users can create accounts here!

export default class SignupScene extends Phaser.Scene {
  constructor() {
    super('SignupScene')
  }

  init(data) {
    this.socket = data.socket
    this.homeSceneUI = data.homeSceneUI;
  }

  create() {
    this.inputElementSignup = this.add.dom(640, 360).createFromCache("signupform");
    this.inputElementSignup.addListener('click');
    this.inputElementSignup.on('click', (event) => {
      //Prevents our form from refreshing the page
      event.preventDefault();
      if (event.target.name === 'signupButton') {
        const username = this.inputElementSignup.getChildByName('username').value;
        const email = this.inputElementSignup.getChildByName('email').value;
        const password = this.inputElementSignup.getChildByName('password').value;
        this.socket.emit("newUserSignup", {
          username,
          email,
          password
        })
      }
    })

    //Sends an error if the user inputs bad account info
    this.errorMessage = this.add.text(450, 600, "", { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '16px' })
    this.socket.on("newUserInfoNotValid", (error) => {
      this.errorMessage.setText(`${error}`)
    })

    //Creates a new account and redirects to UserProfileScene with newly made account :D
    this.socket.on("signUpSuccess", (user) => {
      this.scene.stop("SignupScene");
      this.scene.launch("UserProfileScene", {
        socket: this.socket,
        user: user,
        homeSceneUI: this.homeSceneUI
      })
      this.scene.stop("SignupScene");
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

    //Oh hey I wonder what this does
    this.goBack();
  }

  //No truly this is a mystery that cannot be solved by any other files
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
      this.scene.stop("SignupScene");
    });
  }
}
