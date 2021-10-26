//Creates a sprite that serves as an invisible barrier that sits slightly off the bottom of the screen
//Its purpose is to detect if the player has fallen off the bottom of the map
//The above functionality is handled in the Player class

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