import Phaser from 'phaser'

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene')
  }

  init(data) {
    this.socket = data.socket
  }

  preload() {
    this.load.html('loginform', 'assets/text/loginform.html');
    // we will replace these false images later
    this.load.image('background', 'assets/testImage/falseBackground.png');

  }

  create() {
    this.add.image(640, 360, 'background');

    this.inputElementLogin = this.add.dom(640, 360).createFromCache("loginform");
    this.inputElementLogin.addListener('click');
    this.inputElementLogin.on('click', (event) => {
      if (event.target.name === 'loginButton') {
        const email = this.inputElementLogin.getChildByName('email').value;
        const password = this.inputElementLogin.getChildByName('password').value;

        this.socket.emit("userLogin", {
          email,
          password
        })
      } else if (event.target.name === 'createAccountButton') {
        this.scene.stop("LoginScene");
        this.scene.launch("SignupScene", { socket: this.socket })
      } else if (event.target.name === 'cancel') {
        this.scene.stop("LoginScene");
        // this.scene.launch("HomeScene", { socket: this.socket })
      }
    })

    this.errorMessage = this.add.text(450, 600, "", { color: 'white', fontFamily: 'Arial', fontSize: '32px '})
    this.socket.on("userInfoNotValid", (error) => {
      this.errorMessage.setText(`${error}`)
    })

    this.socket.on("LoginSuccess", (user) => {
      this.scene.stop("LoginScene");
      this.scene.launch("Sandbox", {
        socket: this.socket,
        user: user
      })
    })

  }
}
