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
        this.UI = this.add.group();
        this.add.image(640, 360, 'background');
        this.logo = this.add.image(640, 250, 'logo');
        this.UI.add(this.logo);

        this.music = this.sound.add("lobbyMusic");

        //lobby music... plays continuously
        this.music.play({volume: 0.2, loop: true}); 

        // make sandbox mode button
        // need to navigate to the real sandbox mode
        this.sandboxButton = this.add.image(320, 540, 'sandboxButton').setInteractive();
        this.UI.add(this.sandboxButton);
        this.sandboxButton.on('pointerdown', () => {
          this.scene.start('Sandbox', {socket: this.socket});
        });

        // make multiplayer mode button
        this.multiplayerButton = this.add.image(640, 540, 'multiplayerButton').setInteractive();
        this.UI.add(this.multiplayerButton);
        this.multiplayerButton.on('pointerdown', () => {
          this.scene.start('Prototype',{socket: this.socket});
        })

        // make multiplayer mode button
        this.loginSignupButton = this.add.image(960, 540, 'loginSignupButton').setInteractive();
        this.UI.add(this.loginSignupButton);
        this.loginSignupButton.on('pointerdown', () => {
          console.log("Logging in");
          this.scene.launch('LoginScene', {socket: this.socket, homeSceneUI: this.UI});
        })
    }
}
