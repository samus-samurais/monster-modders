import 'phaser';

//Builds the Player AKA the character that users control
//Not much more to say here, but boy howdy is it important!

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, spriteKey, status, socket, username, colliderInfo) {
        super(scene, x, y, spriteKey);
        this.spriteKey = spriteKey;
        this.socket = socket;
        this.scene = scene;
        this.currentAnim = 'turn'
        this.hasDoubleJumped = false;
        //Add player username directly above player sprite
        this.username = this.scene.add.text(x, y - 37, `${username}`, { color: '#ffc93c',fontSize: '16px ', align: 'center'}).setOrigin(0.5,0.5);

        //Only the playable character gets a physics body or collider info
        //This is because the NPC characters are not technically 'real', per se!
        //They are images puppeted by a stream of socket data, moved around on the screen to show the player how everyone else is doing
        //You do *not* want them colliding with anything, and giving them physics bodies makes them not take kindly to being moved around frame by frame
        //Why did I explain this all? Who am I even talking to? Ah well, t'was good practice
        if(status === 'PC'){
            this.scene.physics.world.enable(this);
            this.setCollideWorldBounds(true);
            // add some colliders function between player and platforms
            //Player is allowed to pass through fallDetector and finishLine, but not platforms
            if(colliderInfo){
                if(colliderInfo.staticPlatforms){
                    this.scene.physics.add.collider(this, colliderInfo.staticPlatforms, this.restoreJumps, null, this);
                }
                if(colliderInfo.platforms){
                    this.scene.physics.add.collider(this, colliderInfo.platforms, this.restoreJumps, null, this);
                }
                if(colliderInfo.fallDetector){
                    this.scene.physics.add.overlap(this, colliderInfo.fallDetector, this.outOfBounds, null, this);
                }
                if(colliderInfo.finishLine){
                    this.scene.physics.add.overlap(this, colliderInfo.finishLine, this.finished, null, this);
                }
            }
        }

        //Adds player to scene, and initializes their starting movement state
        //Their movement state packages their current location and animation, to be sent to other players via sockets
        this.scene.add.existing(this);
        this.movementState = {
            x,
            y,
            currentAnim: 'turn',
        };

        //Builds player animations from spritesheet
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('zombiesprite', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [ { key: 'zombiesprite', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('zombiesprite', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
    }

    //Gives player's double jump back if they had just touched the bottom of a platform (triggered through collider)
    restoreJumps(){
        if(this.body.touching.down){
            this.hasDoubleJumped = false;
        }
    }

    update(cursors,isControllable = true){
        //Updates player movement
        let animation = 'turn';
        if (this.scene && isControllable) {
            if (cursors.left.isDown){
                this.setVelocityX(-190);
                this.anims.play('left', true);
                animation = 'left';
            } else if (cursors.right.isDown){
                this.setVelocityX(190);
                this.anims.play('right', true);
                animation = 'right';
            } else if (this.scene) {
                this.setVelocityX(0);
                this.anims.play('turn');
            }

            //JustDown *very* important here - even a brief keyboard press triggers isDown a dozen times
            //Humans don't exactly press buttons frame-perfectly, ya know
            if(Phaser.Input.Keyboard.JustDown(cursors.up)){
                if(this.body.touching.down){
                    this.setVelocityY(-330);
                } else if(!this.hasDoubleJumped){
                    //If the player has a double jump to use and is not on the ground, double jump is spent and player jumps
                    this.hasDoubleJumped = true;
                    this.setVelocityY(-330);
                }
            }

            // make the username move to follow the player
            this.username.setPosition(this.x,this.y-37);
        }
        //Sends new player position to other players
        if (this.socket) {
            this.movementState.x = this.x
            this.movementState.y = this.y
            this.movementState.currentAnim = animation;
            this.socket.emit('updatePlayer', this.movementState);
        }

    }

    //Function called to move around non-player characters for multiplayer mode
    updateOtherPlayer(movementState){
        this.setPosition(movementState.x, movementState.y);
        if(this.currentAnim !== movementState.currentAnim){
            this.anims.play(movementState.currentAnim)
            this.currentAnim = movementState.currentAnim
        }

        // make the username move to follow the player
        this.username.setPosition(this.x,this.y-37);
    }

    //Delete function, basically a destroy that gets rid of the username too
    delete(){
        this.username.destroy();
        this.destroy();
    }

    //Triggers when player passes through FallDetector
    outOfBounds(){
        this.setPosition(96, 535);
        this.setVelocityY(0);
        if(this.scene.scene.key === 'GameScene'){
            this.scene.loseLives();
        }
    }

    //Hides player and username, prevents player from moving
    disappear() {
        this.setVisible(false);
        this.username.setVisible(false);
        if(this.body){this.body.moves = false;}
    }

    //Shows player and username, lets player move
    reappear() {
        this.setVisible(true);
        this.username.setVisible(true);
        if(this.body){this.body.moves = true;}
    }

    //Forces player to standstill, triggers when player passes finish line in motion
    stop(){
        this.setVelocityX(0);
        this.anims.play('turn');
        if (this.socket) {
            this.movementState.x = this.x
            this.movementState.y = this.y
            this.movementState.currentAnim = 'turn';
            this.socket.emit('updatePlayer', this.movementState);
        }
    }

    //Triggers when player passes finish line
    finished(){
        this.scene.playerReachedFinish();
    }

}
