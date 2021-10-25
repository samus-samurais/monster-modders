import Player from "../sprites/Player.js"

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
        const self = this;
        this.sound.stopAll(); //stop lobby music

        //Creates background
        this.add.image(640, 368, 'LobbymapScreenshot');

        //Creates ground for lobby
        this.staticPlatforms = this.physics.add.staticGroup();
        this.staticPlatforms.create(640, 700, 'platform').setOrigin(0.5,0.5).setSize(1280,40).setDisplaySize(1280,40);

        //play lobbyScene (waitingScene) music
        this.waitingMusic = this.sound.add("waitingMusic");
        this.waitingMusic.play({volume: 0.4, loop: true});

        //Initializes start button
        this.startButton = this.add.image(100,50,'multiplayerButton').setScale(0.5);
        this.startButton.visible = false;
        this.startButton.disableInteractive();
        this.startButton.on('pointerdown', () => {
            this.socket.emit('gameStart');
          })

        //Initializes player counter
        this.playerCounter = this.add.text(900,10,"Players in lobby: ");

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

        this.socket.on('startedGame', function (players, scene = self){
            console.log("players here are",players);
            scene.startGame(players)
        });

        //Sets up controls
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.goBack();

        //With every basic feature initalized, scene sends for room information
        this.socket.emit('joinedRoom',{roomKey: this.roomKey});
    }

    update() {
        if(this.player){
            this.player.update(this.cursors);
        }
    }

    addPlayers(players){
        console.log("Players object: ",players);
        console.log("Socket: ",this.socket);
        let ids = Object.keys(players);
        for(let i = 0; i < ids.length; i++){
            if(ids[i] === this.playerId){
                console.log("Match found!"); //PC == Playable Character!
                if (this.playerInfo && this.playerInfo.email) {
                    this.player = new Player(this, players[ids[i]].x,players[ids[i]].y, 'zombiesprite', 'PC',this.socket, this.playerInfo.username, {staticPlatforms: this.staticPlatforms});
                } else {
                    this.player = new Player(this, players[ids[i]].x,players[ids[i]].y, 'zombiesprite', 'PC',this.socket, players[ids[i]].username, {staticPlatforms: this.staticPlatforms});
                }
            } else {
                console.log("Different player"); //NPC = Non-playable Character
                this.otherPlayers[ids[i]] = new Player(this, players[ids[i]].x, players[ids[i]].y, 'zombiesprite','NPC', null, players[ids[i]].username)
            }
        }
        //Set up player counter, show button if enough players to start game
        this.playerCounter.text = `Players in lobby: ${ids.length}/4`
        if(ids.length>=2){
            this.startButton.visible = true;
            this.startButton.setInteractive();
        }
    }

    addNewPlayer(player){
        console.log("Updating scene with new player:",player);
        this.otherPlayers[player.playerId] = new Player(this, player.x, player.y, 'zombiesprite','NPC', null, player.username)
        console.log("other players are",this.otherPlayers);
        let ids = Object.keys(this.otherPlayers);
        //Update player counter, show button if enough players to start game
        this.playerCounter.text = `Players in lobby: ${ids.length+1}/4`
        if(ids.length+1>=2){
            this.startButton.visible = true;
            this.startButton.setInteractive();

        }
    }

    removePlayer(id){
        console.log("Removing player with id:",id)
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
        console.log("Starting game...");
        console.log('players are', players);
        //VERY IMPORTANT for functioning sockets - always call this when swapping scenes w socket.on calls
        this.socket.removeAllListeners();
        this.scene.start('GameScene', {socket: this.socket, players, user: this.playerInfo});
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
            this.socket.removeAllListeners();
            this.scene.stop("LobbyScene");
            this.waitingMusic.stop();
            this.scene.start("HomeScene", {socket: this.socket, user: this.playerInfo});
            this.socket.emit('leftLobby', this.playerId);
        })
    }
}
