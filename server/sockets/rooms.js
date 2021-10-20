class Room {
    constructor() {
      this.players = {};
      this.playerCount = 0;
      this.platforms = {}
      this.isOpen = true;
      this.gameStarted = false;
    }

    getPlayer(id){
        return this.players[id];
    }

    addPlayer(socket, displayName){
        this.players[socket.id] = {
          playerId: socket.id,
          x: Math.floor(Math.random() * 700) + 50,
          y: Math.floor(Math.random() * 500) + 50
        };
        if(displayName){
          // make suer each login user has correct username in every different scene
          this.players[socket.id].username = displayName;
        } else {
          this.players[socket.id].username =  "Guest" + Math.floor(Math.random() *  9999)
        }
        this.playerCount += 1
        if(this.playerCount == 4){
            this.isOpen = false;
        }
    }

    updatePlayer(movementState){
        this.players[movementState.playerId].x = movementState.x
        this.players[movementState.playerId].y = movementState.y
    }

    removePlayer(id){
        delete this.players[id]
        this.playerCount -= 1;
        if(!this.gameStarted){
            this.isOpen = true;
        }
    }
      
    addPlatform(platform){
        this.platforms[platform.platformId] = platform;
    }
      
    updatePlatform(platform){
        if(this.platforms[platform.platformId]){
            this.platforms[platform.platformId].x = platform.x;
            this.platforms[platform.platformId].y = platform.y;
        }
    }

    placePlatform(platform){
        if(this.platforms[platform.platformId]){
            this.platforms[platform.platformId].alpha = 1.0
        }
    }

    removePlatform(platform){
        delete this.platforms[platform.platformId]
    }

    startGame(){
        for (const key of Object.keys(this.players)) {
            this.players[key].x = 200,
            this.players[key].y = 535
          }
        this.isOpen = false;
        this.gameStarted = true;
    }

    endGame(){
        this.players = {}
        this.platforms = {}
        this.isOpen = true
        this.gameStarted = false;
    }

}

const roomList = {}
for(let i = 1; i <= 9; i++){
    roomList[`room${i}`] = new Room();
}

module.exports = roomList