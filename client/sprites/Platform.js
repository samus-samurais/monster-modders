//A platform constructor, handling user-made platforms!
//The bread and butter of this Bad Boy(TM)

export default class Platform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, spriteKey, socket, id) {
        super(scene, x, y, spriteKey);
        this.spriteKey = spriteKey;
        this.socket = socket;
        this.scene = scene;
        //RE "sticky" - this is a Boolean that sticks platform to mouse cursor if true
        //Used for user-placed platforms, toggled off when the mouse pointer is
        this.sticky = false;
        this.scene.physics.world.enable(this);
        this.scene.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.setInteractive({ draggable: true })
        //Only sets platform to follow cursor if user-placed
        this.alpha = 0.5
        this.id = id;
        //If there is no socket, then the player is in the Sandbox mode
        //If the player is in the sandbox mode, all platforms will be placed by them with generic IDs
        //Ergo, the platform must always be sticky
        if(!this.socket){
            this.sticky = true;
        }
        if(!this.id){
            //If platform has no existing ID, then platform must be being placed by user. Ergo, platform set to sticky
            this.sticky = true;
            //Generates unique platform ID
            this.id = ""
            while(this.id.length<8){
                let unicodeVal = Math.floor(Math.random()*988)+32;
                this.id += String.fromCharCode(unicodeVal);
            }
            console.log("Generated ID of",this.id);
            //Signals the creation of a new platform
            this.socket.emit("newPlatform",
            {
                x: this.x,
                y: this.y,
                platformId: this.id,
                spriteKey: this.spriteKey,
            });
        }
    }

    update(pointer){
        //Keeps sticky platforms on cursor
        if(this.sticky){
            this.setPosition(pointer.x,pointer.y);
        }
        //Lets other players track the platform as it is being moved by the user
        if(this.socket){
            this.socket.emit("movePlatform",
            {
                x: this.x,
                y: this.y,
                platformId: this.id,
            });
        }
    }

    //Sets platform down, emits final location to other users
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
