import 'phaser'
import config from './config/config'
import HomeScene from './scenes/HomeScene'
import LoginScene from './scenes/LoginScene'
import SignupScene from './scenes/SignupScene'
import Prototype from './scenes/Prototype'

// eslint-disable-next-line no-undef
class Game extends Phaser.Game {
  constructor() {
    //initializes the game with set configurations in config.js
    super(config)
    //Adds scenes
    this.scene.add('HomeScene', HomeScene)
    this.scene.add('LoginScene', LoginScene)
    this.scene.add('SignupScene', SignupScene)
    this.scene.add('Prototype', Prototype)

    //Starts prototype (we'll replace this later)
    this.scene.start('HomeScene')
  }
}

window.onload = function () {
  window.game = new Game();
};
