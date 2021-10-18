

export default class Platform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, spriteKey, socket, placedByOpponent) {
        super(scene, x, y, spriteKey);
        this.spriteKey = spriteKey;
        this.socket = socket;
        this.scene = scene;
        this.sticky = false;
        this.new = true; 
        this.scene.physics.world.enable(this);
        this.scene.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.setInteractive({ draggable: true })
        //Only sets platform to follow cursor if user-placed
        if(!placedByOpponent){
            this.sticky = true;
        }
        this.alpha = 0.5
        
        if(this.socket){
            //Generates unique platform ID
            this.id = ""
            while(this.id.length<6){
                let unicodeVal = Math.floor(Math.random()*988)+32;
                this.id += String.fromCharCode(unicodeVal);
            }
            console.log("Generated ID of",this.id);
            this.socket.emit("newPlatform",
            {
                x: this.x,
                y: this.y,
                platformId: this.id,
                spriteKey: this.spriteKey
            });
        }
    }

    update(pointer){
        if(this.sticky){
            this.setPosition(pointer.x,pointer.y);
        }
        if(this.socket){
            this.socket.emit("movePlatform",
            {
                x: this.x,
                y: this.y,
                platformId: this.id,
            });
        }
    }

    place(){
        console.log("Placing platform");
        this.alpha = 1.0
        this.sticky = false;
        if(this.socket){
            this.socket.emit("placePlatform",
            {
                x: this.x,
                y: this.y,
                platformId: this.id,
            });
        }
    }


}