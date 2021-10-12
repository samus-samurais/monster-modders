import Phaser from "phaser";
import io from 'socket.io-client'

export default class HomeScene extends Phaser.Scene {
    constructor() {
        super('HomeScene');
    }

    init(data) {
      console.log('here is the init data', data);
      this.socket = data.socket;
    }

    preload(){
        // Loads basic assets
        // we will replace these false images later
        this.load.image('background', 'assets/testImage/falseBackground.png');
        this.load.image('logo', 'assets/testImage/falseLogo.png');
        this.load.image('sandboxButton', 'assets/testImage/falseSandboxButton.png');
        this.load.image('multiplayerButton', 'assets/testImage/falseMultiplayerButton.png');
        this.load.image('loginSignupButton', 'assets/testImage/falseLoginSignupButton.png');

        //audio
        this.load.audio("lobbyMusic", "assets/audio/lobby-music.mp3");
    }

    create(){
        this.add.image(640, 360, 'background');
        this.add.image(640, 250, 'logo');

        this.music = this.sound.add("lobbyMusic");

        var musicConfig = {
          mute: false,
          volume: 0.2,
          rate: 1,
          detune: 0,
          seek: 0,
          loop: true,
          delay: 0
        }

        this.music.play(musicConfig); //plays music indefinitley

        // make sandbox mode button
        // need to navigate to the real sandbox mode
        this.sandboxButton = this.add.image(320, 540, 'sandboxButton').setInteractive();
        this.sandboxButton.on('pointerdown', () => {
          this.scene.stop('HomeScene');
          this.music.stop(); //stop playing music when this scene is pressed by user
          this.scene.launch('Prototype',{socket: this.socket});
          this.sandboxButton.disableInteractive();
        });

        // make multiplayer mode button
        this.multiplayerButton = this.add.image(640, 540, 'multiplayerButton').setInteractive();
        this.multiplayerButton.on('pointerdown', () => {
          this.scene.launch('Prototype',{socket: this.socket});
          this.multiplayerButton.disableInteractive();
        })

        // make multiplayer mode button
        this.loginSignupButton = this.add.image(960, 540, 'loginSignupButton').setInteractive();
        this.loginSignupButton.on('pointerdown', () => {
          this.scene.launch('SignupScene');
          this.loginSignupButton.disableInteractive();
        })
    }
}