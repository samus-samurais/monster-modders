import 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, spriteKey, socket) {
        super(scene, x, y, spriteKey);
        this.spriteKey = spriteKey;
        this.username = username;
        this.socket = socket;
        this.scene = scene;
        this.scene.physics.world.enable(this);
        this.scene.add.existing(this);
        this.setCollideWorldBounds(true);
        this.movementState = {
            x,
            y,
            currentAnim
        };
    }

    update(cursors){
        //Updates player movement
        let animation = 'turn';
        if (cursors.left.isDown){
            this.setVelocityX(-190);
            this.anims.play('left', true);
            animation = 'left'
        }

        else if (cursors.right.isDown){
            this.setVelocityX(190);
            this.anims.play('right', true);
            animation = 'right'
        } else {
            this.setVelocityX(0);
            this.anims.play('turn');
        }
        if (cursors.up.isDown){
            this.setVelocityY(-330);
        }

        //Sends new player position to other players
        if (this.socket) {
            this.movementState.x = this.x
            this.movementState.y = this.y
            this.currentAnim = animation;
            this.socket.emit('updatePlayer', this.movementState);
          }
    }

    updateOtherPlayer(movementState){
        this.setPosition(moveState.x, moveState.y);
        this.anims.play(movementState.currentAnim)
    }

}