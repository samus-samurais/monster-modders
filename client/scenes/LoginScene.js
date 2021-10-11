import Phaser from 'phaser'
import io from 'socket.io-client'

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

    // create login form from html
    this.inputElementLogin = this.add.dom(640, 360).createFromCache("loginform");
    // add listener click function
    this.inputElementLogin.addListener('click');
    this.inputElementLogin.on('click', (event) => {
      if (event.target.name === 'loginButton') {
        const username = this.inputElementSignup.getChildByName('username').value;
        const password = this.inputElementSignup.getChildByName('password').value;

      }
    })

  }

}
