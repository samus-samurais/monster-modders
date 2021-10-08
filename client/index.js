import 'phaser'
import config from './config/config'
import Prototype from './scenes/Prototype'

class Game extends Phaser.Game {
  constructor() {
    //initializes the game with set configurations in config.js
    super(config)
    //Adds scenes
    this.scene.add('Prototype', Prototype)

    //Starts prototype (we'll replace this later)
    this.scene.start('Prototype')
  }
}

window.onload = function () {
  window.game = new Game();
};
