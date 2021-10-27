import Phaser from "phaser";

//UI that displays upon user starting multiplayer mode
//Lets users select from 1 of 9 different rooms!
//Occupied or elsewise full rooms are disabled with a message explaining as such

export default class RoomSelector extends Phaser.Scene {
    constructor() {
        super('RoomSelector');
    }

    init(data) {
      this.socket = data.socket;
      this.playerInfo = data.user ? data.user : null;
      this.prevSceneUI = data.prevSceneUI
    }

    create(){

      //Disables Home Scene UI
        this.prevSceneUI.children.iterate((child) => {
            child.disableInteractive()
            child.visible = false;
          })
      
        //Initializes room buttons, stores them in here!
        const roomButtons = {}
        roomButtons['room1'] = this.add.image(320, 540, 'room7Button')
        roomButtons['room1'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room1"});
        });

        roomButtons['room2'] = this.add.image(640, 540, 'room8Button')
        roomButtons['room2'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room2"});
        })

        roomButtons['room3'] = this.add.image(960, 540, 'room9Button')
        roomButtons['room3'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room3"});
        });

        roomButtons['room4'] = this.add.image(320, 340, 'room4Button')
        roomButtons['room4'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room4"});
        });

        roomButtons['room5'] = this.add.image(640, 340, 'room5Button')
        roomButtons['room5'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room5"});
        })

        roomButtons['room6'] = this.add.image(960, 340, 'room6Button')
        roomButtons['room6'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room6"});
        });

        roomButtons['room7'] = this.add.image(320, 140, 'Room1Button')
        roomButtons['room7'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room7"});
        });

        roomButtons['room8'] = this.add.image(640, 140, 'room2Button')
        roomButtons['room8'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room8"});
        })

        roomButtons['room9'] = this.add.image(960, 140, 'room3Button')
        roomButtons['room9'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room9"});
        });

        //Sets up "status" text for each button - used to denote the reason for any room being closed
        for (const key of Object.keys(roomButtons)) {
          roomButtons[key].status = this.add.text(roomButtons[key].x, roomButtons[key].y+75, "", { color: 'white', fontFamily: '"Press Start 2P"', fontSize: '14px' }).setOrigin(0.5,0.5);
        }

        //More back button stuff
        this.goBack();

        //Upon recieving room data, enables buttons of rooms that can be entered, else darkens button and displays why room cannot be entered
        this.socket.on("roomDataSent", (roomInfo) => {
            for (const key of Object.keys(roomInfo)) {
              if(roomInfo[key].gameStarted){
                roomButtons[key].setTint(0x343b36);
                roomButtons[key].status.text = "Game in progress"
              } else if(!roomInfo[key].isOpen){
                roomButtons[key].setTint(0x343b36);
                roomButtons[key].status.text = "Room is full"
              } else {
                roomButtons[key].setInteractive();
              }
            }
        })

        //Enables and disables room buttons if rooms open/close when player is on this scene
        this.socket.on("openRoom", (roomInfo) => {
            roomButtons[roomInfo.roomKey].setInteractive();
            roomButtons[roomInfo.roomKey].clearTint();
            roomButtons[roomInfo.roomKey].status.text = ""
        })

        this.socket.on("closeRoom", (roomInfo) => {
            roomButtons[roomInfo.roomKey].disableInteractive();
            roomButtons[roomInfo.roomKey].setTint(0x343b36);
            roomButtons[roomInfo.roomKey].status.text = roomInfo.cause;
        })

        //With everything set up, sends for room data
        this.socket.emit("getRoomData");

    }

    //Builds (b)a back button beneath!
    goBack() {
        const backButton = this.add
          .image(this.scale.width - 20, 20, 'backButton')
          .setScrollFactor(0)
          .setOrigin(1, 0)
          .setScale(2);
        backButton.setInteractive();
        backButton.on("pointerdown", () => {
          backButton.setTint(0xFF0000);
        });
        backButton.on("pointerover", () => {
          backButton.setTint(0xFF0000);
        });
        backButton.on("pointerout", () => {
          backButton.clearTint();
        })
        backButton.on("pointerup", () => {
          this.prevSceneUI.children.iterate((child) => {
            child.setInteractive()
            child.visible = true;
          })
          this.socket.removeAllListeners();
          this.scene.stop("RoomSelector");
        })
      }
}
