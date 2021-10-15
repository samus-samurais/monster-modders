import Player from "../sprites/Player.js"

export default class Prototype extends Phaser.Scene {
    constructor(key) {
        super(key);
        this.player = null
        this.otherPlayers = {}
    }

    init(data){
        this.socket = data.socket;
        this.playerId = data.socket.id;
        this.playerInfo = data.user ? data.user : { username: 'guest' };
        console.log('user info', this.playerInfo)
    }

    create(){
        const self = this;
        //Initializes player
        this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);
        this.socket.emit('playerJoined');

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

        //this.player = new Player(100,450,'dude',this.socket);
        //Makes player bound to world
        //this.player = this.physics.add.sprite(100, 450, 'dude');
        //this.player.setCollideWorldBounds(true);


        //Sets up controls
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
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
                this.player = new Player(this, players[ids[i]].x,players[ids[i]].y, 'dude', 'PC',this.socket, this.playerInfo)

                //this.player = this.physics.add.sprite(players[ids[i]].x,players[ids[i]].y,'dude');
                //this.player.setCollideWorldBounds(true);
            } else {
                console.log("Different player"); //NPC = Non-playable Character
                this.otherPlayers[ids[i]] = new Player(this, players[ids[i]].x, players[ids[i]].y, 'dude','NPC')

            }
        }
        //console.log("Other players object: ",this.otherPlayers);
    }

    addNewPlayer(player){
        console.log("Updating scene with new player:",player);
        this.otherPlayers[player.playerId] = new Player(this, player.x, player.y, 'dude','NPC')
    }

    removePlayer(id){
        console.log("Removing player with id:",id)
        this.otherPlayers[id].destroy();
        delete this.otherPlayers[id];
    }
}
