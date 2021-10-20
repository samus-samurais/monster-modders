import Phaser from "phaser";

export default class HomeScene extends Phaser.Scene {
    constructor() {
        super('HomeScene');
    }

    init(data) {
      console.log('here is the init data', data);
      this.socket = data.socket;
      this.playerInfo = data.user ? data.user : null;
    }

    create(){
        this.UI = this.add.group();
        this.add.image(640, 360, 'background');
        this.logo = this.add.image(640, 250, 'logo');
        this.UI.add(this.logo);

        // this.music = this.sound.add("lobbyMusic");

        //lobby music... plays continuously
        // this.music.play({volume: 0.2, loop: true});

        // make sandbox mode button
        // need to navigate to the real sandbox mode
        this.sandboxButton = this.add.image(320, 540, 'sandboxButton').setInteractive();
        this.UI.add(this.sandboxButton);
        this.sandboxButton.on('pointerdown', () => {
          this.scene.start('Sandbox', {socket: this.socket, user: this.playerInfo});
        });

        // make multiplayer mode button
        this.multiplayerButton = this.add.image(640, 540, 'multiplayerButton').setInteractive();
        this.UI.add(this.multiplayerButton);
        this.multiplayerButton.on('pointerdown', () => {
          this.scene.launch('RoomSelector',{socket: this.socket, user: this.playerInfo, homeSceneUI: this.UI});
        })
        if (this.playerInfo === null || this.playerInfo.email === undefined) {
          // if there is no login user that create login/singup button
          this.loginSignupButton = this.add.image(960, 540, 'loginSignupButton').setInteractive();
          this.UI.add(this.loginSignupButton);
          this.loginSignupButton.on('pointerdown', () => {
            console.log("Logging in");
            this.scene.launch('LoginScene', {socket: this.socket, homeSceneUI: this.UI});
          })
        } else {
          // if there is login user that create UserProfile button
          this.playerInfoButton = this.add.image(960, 540, 'playerInfoButton').setInteractive();
          this.UI.add(this.playerInfoButton);
          this.playerInfoButton.on('pointerdown', () => {
            console.log("Going to user's information");
            this.scene.start('UserProfileScene', {socket: this.socket, user: this.playerInfo});
          })
        }
    }
}
