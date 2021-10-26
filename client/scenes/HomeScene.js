import Phaser from "phaser";

//This is our main menu scene!
//All other UI scenes are ran in tandem with it to keep the menu music consistently running

export default class HomeScene extends Phaser.Scene {
    constructor() {
        super('HomeScene');
    }

    //These aren't used, but are held in the scene to be passed to scenes that need them
    init(data) {
      this.socket = data.socket;
      this.playerInfo = data.user ? data.user : null;
    }

    create(){
        this.sound.stopAll(); //in case of disconnect or page refresh clear any previous music from playing

        //Defines "UI" group to hold any UI belonging to the HomeScene, to be passed to the other UI scenes
        //This lets the other UI scenes disable the Home Scene UI while still running the HomeScene itself
        this.UI = this.add.group();
        this.add.image(640, 360, 'background');
        this.logo = this.add.image(640, 300, 'logo');
        this.UI.add(this.logo);

        //play lobby music
        this.lobbyMusic = this.sound.add("lobbyMusic");
        this.lobbyMusic.play({volume: 0.2, loop: true});

        //make sandbox mode button
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
          this.scene.launch('RoomSelector',{socket: this.socket, user: this.playerInfo, prevSceneUI: this.UI});
        })

        //make leaderboard button
        this.leaderboardButton = this.add.image(960, 150, 'leaderboardButton').setInteractive();
        this.UI.add(this.leaderboardButton);
        this.leaderboardButton.on('pointerdown', () => {
          this.scene.launch("LeaderboardScene", {socket: this.socket, homeSceneUI: this.UI, user: this.playerInfo});
        })

        if (this.playerInfo === null || this.playerInfo.email === undefined) {
          // if there is no login user then create login/singup button
          this.loginSignupButton = this.add.image(960, 540, 'loginSignupButton').setInteractive();
          this.UI.add(this.loginSignupButton);
          this.loginSignupButton.on('pointerdown', () => {
            this.scene.launch('LoginScene', {socket: this.socket, homeSceneUI: this.UI});
          })
        } else {
          // if there is login user then create UserProfile button
          this.playerInfoButton = this.add.image(960, 540, 'playerInfoButton').setInteractive();
          this.UI.add(this.playerInfoButton);
          this.playerInfoButton.on('pointerdown', () => {
            this.scene.launch('UserProfileScene', {socket: this.socket, user: this.playerInfo, homeSceneUI: this.UI});
          })
        }
    }
}
