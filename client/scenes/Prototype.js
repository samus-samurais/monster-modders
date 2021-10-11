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
      }

      create(){
        const self = this;
        //Initializes player
        this.add.image(400, 300, 'sky');
        this.socket.emit('playerJoined', );
        this.socket.on('sentPlayerInfo', function (players, scene = self) {
            scene.addPlayers(players);
          });
        //this.player = new Player(this.socket.x,this.socket.y,'dude',this.socket);
        //Makes player bound to world
        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setCollideWorldBounds(true);


        //Sets up controls
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        //Implements animations
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
    }

      update (){
        if (this.cursors.left.isDown){
            this.player.setVelocityX(-190);
            this.player.anims.play('left', true);
        }

        else if (this.cursors.right.isDown){
            this.player.setVelocityX(190);
            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (this.cursors.up.isDown){
            this.player.setVelocityY(-330);
        }
    }

    addPlayers(players){
        console.log("So, can we get all the info here?");
        console.log("Players object: ",players);
        console.log("Socket: ",this.socket);
        /*
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                this.player = this.physics.add.sprite(players[id].x, players[id].y, 'dude');
            } else {
                let otherPlayer = this.physics.add.sprite(players[id].x, players[id].y, 'dude');
            }
        });
        */
    }

    addNewPlayer(){

    }
}