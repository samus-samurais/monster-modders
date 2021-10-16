export default class FallDetector extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, socket) {
        super(scene, 640, 900, "fallDetector");
        this.socket = socket;
        this.scene = scene;
        this.alpha = 0.0;
        this.scene.physics.world.enable(this);
        this.scene.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true); 
    }
}