import 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, spriteKey, status, socket, username, colliderInfo) {
        super(scene, x, y, spriteKey);
        this.spriteKey = spriteKey;
        this.socket = socket;
        this.scene = scene;
        this.currentAnim = 'turn'
        console.log("This runs?")
        this.name = (username ? username : "Guest" + Math.floor(Math.random() *  9999))
         //Add player username to scene
         this.username = this.scene.add.text(x, y - 37, `${this.name}`, { color: 'purple', fontFamily: 'Arial', fontSize: '16px ', align: 'center'}).setOrigin(0.5,0.5);

        if(status === 'PC'){
            this.scene.physics.world.enable(this);
            this.setCollideWorldBounds(true);
            // add some colliders function between player and platforms
            if(colliderInfo){
            console.log("Collider info is: ",colliderInfo);
            this.scene.physics.add.collider(this, colliderInfo.staticPlatforms, null, null, this);
            this.scene.physics.add.collider(this, colliderInfo.platforms, null, null, this);
            this.scene.physics.add.overlap(this, colliderInfo.fallDetector, this.outOfBounds, null, this);
            } else {
                console.log("Undefined collider info");
            }
        }

        this.scene.add.existing(this);
        this.movementState = {
            x,
            y,
            currentAnim: 'turn',
        };

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

    update(cursors){
        //Updates player movement
        let animation = 'turn';
        if (cursors.left.isDown){
            this.setVelocityX(-190);
            this.anims.play('left', true);
            animation = 'left';
        }

        else if (cursors.right.isDown){
            this.setVelocityX(190);
            this.anims.play('right', true);
            animation = 'right';
        } else {
            this.setVelocityX(0);
            this.anims.play('turn');
        }
        if (cursors.up.isDown){
            this.setVelocityY(-330);
        }

        // make the username move to follow the player
        this.username.setPosition(this.x,this.y-37);

        //Sends new player position to other players
        if (this.socket) {
            this.movementState.x = this.x
            this.movementState.y = this.y
            this.movementState.currentAnim = animation;
            this.socket.emit('updatePlayer', this.movementState);
        }

    }

    updateOtherPlayer(movementState){
        this.setPosition(movementState.x, movementState.y);
        if(this.currentAnim !== movementState.currentAnim){
            this.anims.play(movementState.currentAnim)
            this.currentAnim = movementState.currentAnim
        }

        // make the username move to follow the player
        this.username.setPosition(this.x,this.y-37);
    }

    delete(){
        this.username.destroy();
        this.destroy();
    }

    outOfBounds(){
        console.log("Oops!");
        this.setPosition(200,535);
        this.setVelocityY(0);
    }

}
