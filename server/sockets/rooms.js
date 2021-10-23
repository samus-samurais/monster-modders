class Room {
    constructor() {
      this.players = {};
      this.playerCount = 0;
      this.platforms = {}
      this.isOpen = true;
      this.gameStarted = false;
      //Timers set to be one second above their actual values to account for updateTimer initializations
      this.gameTimer = 16;
      this.platformTimer = 11;
      this.playersReady = 0;
      this.timerId = null;
      this.pointsToWin = 0;
      this.pointsForFinishing = 0;
    }

    runGameTimer() {
        if(this.gameTimer > 0) {
            this.gameTimer -= 1;
        }
    }

    runPlatformTimer() {
        if(this.platformTimer > 0) {
            this.platformTimer -= 1;
        }
    }

    resetPlatformTimer() {
        this.platformTimer = 10;
    }

    resetGameTimer() {
        this.gameTimer = 15;
    }

    getPlayer(id){
        return this.players[id];
    }

    addPlayer(socket, displayName){
        this.players[socket.id] = {
          playerId: socket.id,
          x: Math.floor(Math.random() * 700) + 50,
          y: Math.floor(Math.random() * 500) + 50,
          points: 0,
          placedThisRound: 0
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
        if(this.players[movementState.playerId]){
            this.players[movementState.playerId].x = movementState.x
            this.players[movementState.playerId].y = movementState.y
        }
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

    //Increments points depending on order players finish, returns true if all players have finished
    playerFinished(playerId){
        this.players[playerId].points += this.pointsForFinishing;
        //Logs player placement via the amount of 'pointsForFinishing' still remaining
        //If there are 3 players, first place will be Abs(3-3-1)=1, second place will be Abs(2-3-1)=2, etc.
        this.players[playerId].placedThisRound = Math.abs(this.pointsForFinishing - this.playerCount - 1);
        this.pointsForFinishing -= 1;
        if(this.pointsForFinishing===0){
            return true;
        } else {
            return false;
        }
    }

    startGame(){
        for (const key of Object.keys(this.players)) {
            this.players[key].x = 200,
            this.players[key].y = 535
          }
        this.playersReady = 0
        this.pointsToWin = this.playerCount * 4;
        this.pointsForFinishing = this.playerCount;
        this.isOpen = false;
        this.gameStarted = true;
    }

    endGame(){
        this.platforms = {}
        this.playersReady = 0;
        this.isOpen = true
        this.gameStarted = false;
    }
    

}

const roomList = {}
for(let i = 1; i <= 9; i++){
    roomList[`room${i}`] = new Room();
}

module.exports = roomList