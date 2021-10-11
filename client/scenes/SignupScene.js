import Phaser from 'phaser'
import io from 'socket.io-client'
import store, { createUserThunk } from '../redux/userStore.js'

export default class SignupScene extends Phaser.Scene {
  constructor() {
    super('SignupScene')
  }

  init(data) {
    this.socket = data.socket
  }

  preload() {
    this.load.html('signupform', 'assets/text/signupform.html');
    // we will replace these false images later
    this.load.image('background', 'assets/testImage/falseBackground.png');

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

        // create new user by dispatching thunk function
        store.dispatch(createUserThunk({ username, email, password}));
      }
    })

    // create error message when the user information already in use
    this.errorMessage = this.add.text(450, 600, '', { color: 'white', fontFamily: 'Arial', fontSize: '32px'});
    store.subscribe(() => {
      this.newUser = store.getState();
      this.error = this.newUser.error;
    })

  }

  update() {
    if (
      this.error &&
      this.error.response &&
      this.error.response.data === 'username/email already in use'
    ) {
      this.errorMessage.setText('username/email already in use')
    } else {
      this.errorMessage.setText('')
    }
  }
}
