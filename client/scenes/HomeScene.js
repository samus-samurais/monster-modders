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

    create(){
        this.add.image(640, 360, 'background');
        this.add.image(640, 250, 'logo');

        this.music = this.sound.add("lobbyMusic");

        //lobby music... plays continuously
        this.music.play({volume: 0.2, loop: true}); 

        // make sandbox mode button
        // need to navigate to the real sandbox mode
        this.sandboxButton = this.add.image(320, 540, 'sandboxButton').setInteractive();
        this.sandboxButton.on('pointerdown', () => {
          this.scene.stop('HomeScene');
          this.music.stop(); //stop playing music when this scene is pressed by user
          this.scene.launch('Sandbox', {socket: this.socket});
          this.sandboxButton.disableInteractive();
        });

        // make multiplayer mode button
        this.multiplayerButton = this.add.image(640, 540, 'multiplayerButton').setInteractive();
        this.multiplayerButton.on('pointerdown', () => {
          this.music.stop(); //stop playing music when this scene is pressed by user
          this.scene.launch('Prototype',{socket: this.socket});
          this.multiplayerButton.disableInteractive();
        })

        // make multiplayer mode button
        this.loginSignupButton = this.add.image(960, 540, 'loginSignupButton').setInteractive();
        this.loginSignupButton.on('pointerdown', () => {
          this.scene.launch('LoginScene', {socket: this.socket});
          this.loginSignupButton.disableInteractive();
        })
    }
}
