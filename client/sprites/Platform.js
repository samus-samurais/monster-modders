

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
        this.sticky = true;
        this.alpha = 0.5
        
        if(this.socket){
            this.new = true; 
            //Generates unique platform ID
            this.id = ""
            while(this.id.length<8){
                let unicodeVal = Math.floor(Math.random()*988)+32;
                this.id += String.fromCharCode(unicodeVal);
            }
            console.log("Generated ID of",this.id);
        }
    }

    update(pointer){
        if(this.sticky){
            this.setPosition(pointer.x,pointer.y);
        }
        if(this.socket){
            //Do socket things
        }
    }

    place(){
        console.log("Placing platform");
        this.alpha = 1.0
        this.sticky = false;
        if(this.socket){
            //Do socket things
        }

    }

}