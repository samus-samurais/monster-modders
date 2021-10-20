import Phaser from "phaser";

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

        this.socket.emit("getRoomData");

        this.prevSceneUI.children.iterate((child) => {
            child.disableInteractive()
            child.visible = false;
          })

        const roomButtons = {}
        roomButtons['room1'] = this.add.image(320, 540, 'multiplayerButton')
        roomButtons['room1'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room1"});
        });

        roomButtons['room2'] = this.add.image(640, 540, 'multiplayerButton')
        roomButtons['room2'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room2"});
        })

        roomButtons['room3'] = this.add.image(960, 540, 'multiplayerButton')
        roomButtons['room3'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room3"});
        });

        roomButtons['room4'] = this.add.image(320, 340, 'multiplayerButton')
        roomButtons['room4'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room4"});
        });

        roomButtons['room5'] = this.add.image(640, 340, 'multiplayerButton')
        roomButtons['room5'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room5"});
        })

        roomButtons['room6'] = this.add.image(960, 340, 'multiplayerButton')
        roomButtons['room6'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room6"});
        });

        roomButtons['room7'] = this.add.image(320, 140, 'multiplayerButton')
        roomButtons['room7'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room7"});
        });

        roomButtons['room8'] = this.add.image(640, 140, 'multiplayerButton')
        roomButtons['room8'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room8"});
        })

        roomButtons['room9'] = this.add.image(960, 140, 'multiplayerButton')
        roomButtons['room9'].on('pointerdown', () => {
            this.socket.removeAllListeners();
            this.scene.start('LobbyScene', {socket: this.socket, user: this.playerInfo, roomKey: "room9"});
        });

        this.goBack();

        this.socket.on("roomDataSent", (roomList) => {
            for (const key of Object.keys(roomList)) {
                if(roomList[key].isOpen){
                    roomButtons[key].setInteractive();
                } else {
                    roomButtons[key].setTint(0x343b36);
                }
              }
        })

        this.socket.on("openRoom", (roomInfo) => {
            roomButtons[roomInfo.roomKey].setInteractive();
            roomButtons[roomInfo.roomKey].clearTint();
        })

        this.socket.on("closeRoom", (roomInfo) => {
            roomButtons[roomInfo.roomKey].disableInteractive();
            roomButtons[roomInfo.roomKey].setTint(0x343b36);
        })

    }

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
