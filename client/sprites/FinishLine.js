export default class FinishLine extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, socket) {
        super(scene, 1190, 378, "finishLine");
        this.setOrigin(0,1);
        this.setScale(0.45,0.45);
        this.socket = socket;
        this.scene = scene;
        this.scene.physics.world.enable(this);
        this.scene.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
    }
}
