

export default class Platform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, spriteKey, socket) {
        super(scene, x, y, spriteKey);
        this.spriteKey = spriteKey;
        this.socket = socket;
        this.scene = scene;
        this.scene.physics.world.enable(this);
        this.scene.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.setInteractive({ draggable: true })
        this.new = true;   
    }
}