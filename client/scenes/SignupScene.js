import Phaser from 'phaser'

export default class SignupScene extends Phaser.Scene {
  constructor() {
    super('SignupScene')
  }

  init(data) {
    this.socket = data.socket
  }

  create() {
    this.add.image(640, 360, 'background');

    this.inputElementSignup = this.add.dom(640, 360).createFromCache("signupform");
    this.inputElementSignup.addListener('click');
    this.inputElementSignup.on('click', (event) => {
      if (event.target.name === 'signupButton') {
        const username = this.inputElementSignup.getChildByName('username').value;
        const email = this.inputElementSignup.getChildByName('email').value;
        const password = this.inputElementSignup.getChildByName('password').value;

        this.socket.emit("newUserSignup", {
          username,
          email,
          password
        })
      } else if (event.target.name === 'cancel') {
        this.scene.stop("SignupScene");
        this.scene.launch("HomeScene", { socket: this.socket })
      }
    })

    this.errorMessage = this.add.text(450, 600, "", { color: 'white', fontFamily: 'Arial', fontSize: '32px '})
    this.socket.on("newUserInfoNotValid", (error) => {
      this.errorMessage.setText(`${error}`)
    })

    this.socket.on("signUpSuccess", (user) => {
      this.scene.stop("SignupScene");
      this.scene.launch("UserProfileScene", {
        socket: this.socket,
        user: user
      })
    })

  }
}
