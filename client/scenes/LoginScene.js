import Phaser from 'phaser'
import io from 'socket.io-client'

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene')
  }

  preload() {
    this.load.html('loginForm', 'assets/text/loginform.html');
    // we will replace these false images later
    this.load.image('background', 'assets/testImage/falseBackground.png');

  }

  create() {
    this.add.image(640, 360, 'background');

    var text = this.add.text(440, 10, 'Please show me the login form!', { color: 'white', fontFamily: 'Arial', fontSize: '32px '});

    this.inputElement = this.add.dom(640, 360).createFromCache("loginForm");

    this.inputElement.addListener('click');
    this.inputElement.on('click', (event) => {
      if (event.target.name === 'loginButton') {
        const username = this.inputElement.getChildByName('username');
        const password = this.inputElement.getChildByName('password');
        console.log('here is the login information: ', username, password)
      } else {
        console.log('the event.target.name did not happen in loginButton')
      }
    })

  }

}
