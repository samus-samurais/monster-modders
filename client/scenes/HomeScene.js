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

        this.lobbyMusic = this.sound.add("lobbyMusic");
        this.lobbyMusic.play({volume: 0.2, loop: true}); //lobby music plays continuously

        // make sandbox mode button
        // need to navigate to the real sandbox mode
        this.sandboxButton = this.add.image(320, 540, 'sandboxButton').setInteractive();
        this.UI.add(this.sandboxButton);
        this.sandboxButton.on('pointerdown', () => {
          this.lobbyMusic.stop();
          this.scene.start('Sandbox', {socket: this.socket, user: this.playerInfo});
        });

        //make tutorial button
        this.tutorialButton = this.add.image(320, 150, 'tutorialButton').setInteractive();
        this.UI.add(this.tutorialButton);
        this.tutorialButton.on('pointerdown', () => {
          this.scene.launch("TutorialScene", {socket: this.socket, homeSceneUI: this.UI, user: this.playerInfo});
        })

        // make multiplayer mode button
        this.multiplayerButton = this.add.image(640, 540, 'multiplayerButton').setInteractive();
        this.UI.add(this.multiplayerButton);
        this.multiplayerButton.on('pointerdown', () => {
          console.log("Important data");
          this.scene.launch('RoomSelector',{socket: this.socket, user: this.playerInfo, prevSceneUI: this.UI});
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
