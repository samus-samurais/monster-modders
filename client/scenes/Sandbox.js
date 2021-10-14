import Phaser from "phaser"
import Player from "../sprites/Player.js"

export default class Sandbox extends Phaser.Scene {
  constructor() {
    super("Sandbox");
    this.player = null;
  }

  init(data){
    this.socket = data.socket;
    this.playerId = data.socket.id;
    this.playerUsername = data.user ? data.user.username : 'guest';
    console.log('check its a login user or guest--', this.playerUsername)
  }

  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('platform', 'assets/platform/falseShortPlatform.png');
  }

  create() {
    const self = this;

    this.add.image(640, 360, 'sky').setDisplaySize(1280,720).setOrigin(0.5,0.5);

    this.socket.emit('playerJoined');
    this.socket.on('sentPlayerInfo', function (players, scene = self) {
        scene.addPlayers(players);
    });

    // create static platfrom as begining and goal place.
    this.staticPlatform = this.physics.add.staticGroup();
    this.staticPlatform.create(200, 600, 'platform');
    this.staticPlatform.create(1000, 200, 'platform');

    // create the platforms for player to choose and drag
    this.platform = this.physics.add.image(200, 200, 'platform').setImmovable(true);
    this.platform.body.setAllowGravity(false);
    this.platform.setInteractive({ draggable: true })

    this.input.setDraggable(this.platform);

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    })

    //Sets up controls
    this.cursors = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });
  }

  update () {
    if(this.player){
        this.player.update(this.cursors);
    }

  }

  addPlayers(players){
    console.log("Players object: ",players);
    console.log("Socket: ",this.socket);
    let ids = Object.keys(players);
    for(let i = 0; i < ids.length; i++){
        if(ids[i] === this.playerId){
            console.log("Match found!"); //PC == Playable Character!

            // add new arguments in to the Player class
            this.player = new Player(this, players[ids[i]].x,players[ids[i]].y, 'dude', 'PC',this.socket, this.playerUsername, this.platform, this.staticPlatform)

            // not sure whether we need the otherPlayers functionality here or not
        } else {
            console.log("Different player"); //NPC = Non-playable Character
            this.otherPlayers[ids[i]] = new Player(this, players[ids[i]].x,players[ids[i]].y, 'dude','NPC')
        }
    }
}

}
