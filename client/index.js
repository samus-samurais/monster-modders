import 'phaser'
import config from './config/config'
import HomeScene from './scenes/HomeScene'
import LoginScene from './scenes/LoginScene'
import SignupScene from './scenes/SignupScene'
import LobbyScene from './scenes/LobbyScene'
import InitialLoader from './scenes/Loader'
import Sandbox from './scenes/Sandbox'
import UserProfileScene from './scenes/UserProfileScene'
import GameScene from './scenes/GameScene'
import RoomSelector from './scenes/RoomSelector'
import { io } from 'socket.io-client';
import TutorialScene from './scenes/TutorialScene'

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
    this.scene.add('LobbyScene', LobbyScene)
    this.scene.add('InitialLoader', InitialLoader)
    this.scene.add('Sandbox', Sandbox)
    this.scene.add('UserProfileScene', UserProfileScene)
    this.scene.add('GameScene', GameScene)
    this.scene.add('RoomSelector', RoomSelector)
    this.scene.add("TutorialScene", TutorialScene)

    //Starts the loader
    this.scene.start('InitialLoader',{socket: this.socket})
  }
}

window.onload = function () {
  window.game = new Game();
};
