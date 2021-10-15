import 'phaser'
import config from './config/config'
import HomeScene from './scenes/HomeScene'
import LoginScene from './scenes/LoginScene'
import SignupScene from './scenes/SignupScene'
import Prototype from './scenes/Prototype'
import InitialLoader from './scenes/Loader'
import Sandbox from './scenes/Sandbox'
import UserProfileScene from './scenes/UserProfileScene'
import { io } from 'socket.io-client';

// eslint-disable-next-line no-undef
class Game extends Phaser.Game {
  constructor() {
    //initializes the game with set configurations in config.js
    super(config)


    //Connects to socket
		this.socket = io();

    //Adds scenes
    this.scene.add('HomeScene', HomeScene)
    this.scene.add('LoginScene', LoginScene)
    this.scene.add('SignupScene', SignupScene)
    this.scene.add('Prototype', Prototype)
    this.scene.add('InitialLoader', InitialLoader)
    this.scene.add('Sandbox', Sandbox)
    this.scene.add('UserProfileScene', UserProfileScene)

    //Starts prototype (we'll replace this later)
    this.scene.start('InitialLoader',{socket: this.socket})
  }
}

window.onload = function () {
  window.game = new Game();
};
