import Player from "../sprites/Player.js"

//Lobby for game rooms
//Loads a small platforming world for players to run around in whilst waiting for a room to fill
//Once enough players are in the room, a start button appears to launch the game itself

export default class LobbyScene extends Phaser.Scene {
    constructor(key) {
        super(key);
        this.player = null
        this.otherPlayers = {}
        this.startButton = null;
        this.playerCounter = null;
    }

    init(data){
        this.socket = data.socket;
        this.playerId = data.socket.id;
        this.playerInfo = data.user ? data.user : null
        this.roomKey = data.roomKey;
    }

    create(){

        //Defines self variable to handle scoping issues in sockets
        //This would be rendered unnecessary had I simply used arrow functions for all my sockets
        //But I didn't, and don't wanna touch anything that might explode, so here we are!
        const self = this;
        this.sound.stopAll(); //stop lobby music

        //Creates background
        this.add.image(640, 368, 'LobbymapFinal');

        //Creates ground for lobby
        this.staticPlatforms = this.physics.add.staticGroup();
        this.staticPlatforms.create(800, 416, 'lobbyStaticPlatform1');
        this.staticPlatforms.create(48, 320, 'lobbyStaticPlatform2');
        this.staticPlatforms.create(48, 640, 'lobbyStaticPlatform2');
        this.staticPlatforms.create(368, 384, 'lobbyStaticPlatform2');
        this.staticPlatforms.create(560, 544, 'lobbyStaticPlatform2');
        this.staticPlatforms.create(800, 288, 'lobbyStaticPlatform2');
        this.staticPlatforms.create(1024, 128, 'lobbyStaticPlatform2');
        this.staticPlatforms.create(256, 544, 'lobbyStaticPlatform3');
        this.staticPlatforms.create(1232, 320, 'lobbyStaticPlatform3');
        this.staticPlatforms.create(1152, 512, 'lobbyStaticPlatform3');
        this.staticPlatforms.create(992, 640, 'lobbyStaticPlatform3');
        this.staticPlatforms.create(640, 690, 'lobbyStaticPlatformDown');

        //play lobbyScene (waitingScene) music
        this.waitingMusic = this.sound.add("waitingMusic");
        this.waitingMusic.play({volume: 0.4, loop: true});

        //Initializes start button
        this.startButton = this.add.image(100,50,'startButton').setScale(0.3);
        this.startButton.visible = false;
        this.startButton.disableInteractive();
        this.startButton.on('pointerdown', () => {
            this.socket.emit('gameStart');
          })

        //Initializes player counter
        this.playerCounter = this.add.text(900, 10, "Players in lobby: ", {fontSize: '16px'});

        //Gets info from server to load self and existing players
        this.socket.on('sentPlayerInfo', function (players, scene = self) {
            scene.addPlayers(players);
        });

        //Adds new player if player joins
        this.socket.on('newPlayer', function (newPlayer, scene = self) {
            scene.addNewPlayer(newPlayer);

        });

        //Removes player if player disconnects
        this.socket.on('playerLeft', function (id, scene = self) {
            scene.removePlayer(id)
        });


        //Updates other players when they move
        this.socket.on('playerMoved', function (movementState, scene = self) {
            if(scene.otherPlayers[movementState.playerId]){
            scene.otherPlayers[movementState.playerId].updateOtherPlayer(movementState);
            }
        });

        //Starts game once someone presses the start button
        this.socket.on('startedGame', function (players, scene = self){
            scene.startGame(players)
        });

        //Sets up controls
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        //Makes back button
        this.goBack();

        //With every basic feature initalized, scene sends for room information
        this.socket.emit('joinedRoom',{roomKey: this.roomKey});
    }

    update() {
        //Handles player movement
        if(this.player){
            this.player.update(this.cursors);
        }
    }

    addPlayers(players){
        let ids = Object.keys(players);
        for(let i = 0; i < ids.length; i++){
            if(ids[i] === this.playerId){
                //PC == Playable Character!
                if (this.playerInfo && this.playerInfo.email) {
                    this.player = new Player(this, players[ids[i]].x,players[ids[i]].y, 'zombiesprite', 'PC',this.socket, this.playerInfo.username, {staticPlatforms: this.staticPlatforms});
                } else {
                    this.player = new Player(this, players[ids[i]].x,players[ids[i]].y, 'zombiesprite', 'PC',this.socket, players[ids[i]].username, {staticPlatforms: this.staticPlatforms});
                }
            } else {
                //NPC = Non-playable Character. See GameScene for more info on this if confused
                this.otherPlayers[ids[i]] = new Player(this, players[ids[i]].x, players[ids[i]].y, 'zombiesprite','NPC', null, players[ids[i]].username)
            }
        }
        //Sets up player counter, show button if enough players to start game
        this.playerCounter.text = `Players in lobby: ${ids.length}/4`
        if(ids.length>=2){
            this.startButton.visible = true;
            this.startButton.setInteractive();
        }
    }

    //Handles new players joining room
    addNewPlayer(player){
        this.otherPlayers[player.playerId] = new Player(this, player.x, player.y, 'zombiesprite','NPC', null, player.username)
        let ids = Object.keys(this.otherPlayers);
        //Update player counter, show button if enough players to start game
        this.playerCounter.text = `Players in lobby: ${ids.length+1}/4`
        if(ids.length+1>=2){
            this.startButton.visible = true;
            this.startButton.setInteractive();

        }
    }

    //Handles players leaving room
    removePlayer(id){
        this.otherPlayers[id].delete();
        delete this.otherPlayers[id];
        let ids = Object.keys(this.otherPlayers);
        //Update player counter, hide button if not enough players to start game
        this.playerCounter.text = `Players in lobby: ${ids.length+1}/4`
        if(ids.length+1<2){
            this.startButton.visible = false;
            this.startButton.disableInteractive();
        }
    }

    startGame(players){
        //VERY IMPORTANT for functioning sockets - always call this when stopping scenes w socket.on calls
        this.socket.removeAllListeners();
        //Note for Future Devs (or just me when I forget): start stops current scene and runs new one, launch runs the scene in tandem 
        this.scene.start('GameScene', {socket: this.socket, players, user: this.playerInfo});
    }

    //Makes a back button!
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
            this.socket.removeAllListeners();
            this.scene.stop("LobbyScene");
            this.waitingMusic.stop();
            this.scene.start("HomeScene", {socket: this.socket, user: this.playerInfo});
            this.socket.emit('leftLobby', this.playerId);
        })
    }
}
