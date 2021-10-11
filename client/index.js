import 'phaser'
import config from './config/config'
import HomeScene from './scenes/HomeScene'
import SignupScene from './scenes/SignupScene'
import Prototype from './scenes/Prototype'
import InitialLoader from './scenes/Loader'
import io from 'socket.io-client';

// eslint-disable-next-line no-undef
class Game extends Phaser.Game {
  constructor() {
    //initializes the game with set configurations in config.js
    super(config)
    

    //Connects to socket
		this.socket = io();

    //Adds scenes
    this.scene.add('HomeScene', HomeScene)
    this.scene.add('SignupScene', SignupScene)
    this.scene.add('Prototype', Prototype)
    this.scene.add('InitialLoader', InitialLoader)

    //Starts prototype (we'll replace this later)
    this.scene.start('HomeScene',{socket: this.socket})
  }
}

window.onload = function () {
  window.game = new Game();
};
