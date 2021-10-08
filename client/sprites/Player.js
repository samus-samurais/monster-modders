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
        left,
        right,
        up,
        down
        };
    }

    update(cursors){
        //Updates player movement
        if (cursors.left.isDown){
            this.player.setVelocityX(-190);
            this.player.anims.play('left', true);
        }

        else if (cursors.right.isDown){
            this.player.setVelocityX(190);
            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (cursors.up.isDown){
            this.player.setVelocityY(-330);
        }

        //Sends player movement to other players
        if (this.socket) {
            this.movementState.left=cursors.left.isDown
            this.movementState.right=cursors.right.isDown
            this.movementState.up=cursors.up.isDown
            this.socket.emit('updatePlayer', this.movementState);
          }
    }

    updateOtherPlayer(movementState){
        if (movementState.left){
            this.player.setVelocityX(-190);
            this.player.anims.play('left', true);
        }
        else if (movementState.right){
            this.player.setVelocityX(190);
            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }
        if (movementState.up){
            this.player.setVelocityY(-330);
        }
    }

}