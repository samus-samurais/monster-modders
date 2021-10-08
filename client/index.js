import 'phaser'
import config from './config/config'
import Prototype from './scenes/Prototype'
import io from 'socket.io-client';

class Game extends Phaser.Game {
  constructor() {
    //initializes the game with set configurations in config.js
    super(config)
    

    //Connects to socket
		this.socket = io();

    //Adds scenes
    this.scene.add('Prototype', Prototype)

    //Starts prototype (we'll replace this later)
    this.scene.start('Prototype',{socket: this.socket})
  }
}

window.onload = function () {
  window.game = new Game();
};