class Room {
    constructor() {
      this.players = {};
      this.playerCount = 0;
      this.platforms = {}
      this.isOpen = true;
      this.gameStarted = false;
      this.gameTimer = 20;
      this.platformTimer = 10;
      this.pointsTimer = 6;
      this.playersReady = 0;
      this.timerId = null;
      this.pointsToWin = 0;
      this.pointsForFinishing = 0;
    }

    //Ticks timers down when these functions are called
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

    runPointsTimer() {
        if(this.pointsTimer > 0) {
            this.pointsTimer -= 1;
        }
    }

    //Resets timers that the game depends upon
    //(If I come back to this: Shouldn't the points timer be here? Is there a reason it shouldn't be?)
    resetGameTimers() {
        this.gameTimer = 20;
        this.platformTimer = 10;
    }

    //Fetches specific player from room. Did I ever remember to use this lol
    getPlayer(id){
        return this.players[id];
    }

    //Adds player to lobby
    addPlayer(socket, loginUser){
        this.players[socket.id] = {
          playerId: socket.id,
          x: Math.floor(Math.random() * 700) + 50,
          y: Math.floor(Math.random() * 500) + 50,
          points: 0,
          placedThisRound: 0
        };
        if(loginUser){
          // make suer each login user has correct username in every different scene
          this.players[socket.id].username = loginUser.username;
          this.players[socket.id].uid = loginUser.uid;
        } else {
        //If a player is not logged in, give them a random Guest username
          this.players[socket.id].username =  "Guest" + Math.floor(Math.random() *  9999)
        }
        //Increments playerCount, closes room is player is full
        this.playerCount += 1
        if(this.playerCount == 4){
            this.isOpen = false;
        }
    }

    //Handles player movement
    updatePlayer(movementState){
        if(this.players[movementState.playerId]){
            this.players[movementState.playerId].x = movementState.x
            this.players[movementState.playerId].y = movementState.y
        }
    }

    //Removes player from lobby when player leaves, opens room accordingly
    removePlayer(id){
        delete this.players[id]
        this.playerCount -= 1;
        if(!this.gameStarted){
            this.isOpen = true;
        }
    }

    //Handles platform stuff
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
        //Adds current points for finishing to player's point total
        //Points for finishing starts at the number of players in the room, and decreases whenever a player finishes
        //This way, players coming in 1st through 4th place (or 1st through 3rd or 2nd for 2-3 player games) are rewarded accordingly
        this.players[playerId].points += this.pointsForFinishing;
        //Logs player placement via the amount of 'pointsForFinishing' still remaining
        //If there are 3 players, first place will be Abs(3-3-1)=1, second place will be Abs(2-3-1)=2, etc.
        //placedThisRound = 0 indicates that the player did not finish
        this.players[playerId].placedThisRound = Math.abs(this.pointsForFinishing - this.playerCount - 1);
        this.pointsForFinishing -= 1;
        //If pointsForFinishing is ever zero, then everybody has finished! 
        //Ergo, our function returns true to denote this
        if(this.pointsForFinishing===0){
            return true;
        } else {
            return false;
        }
    }

    //Handles setup for a newly started game
    startGame(){
        for (const key of Object.keys(this.players)) {
            this.players[key].x = 96,
            this.players[key].y = 535
          }
        this.playersReady = 0
        //Since more points are given out in games with more players, the number of points to win scales with playercount
        this.pointsToWin = this.playerCount * 4;
        this.pointsForFinishing = this.playerCount;
        this.isOpen = false;
        this.gameStarted = true;
    }

    //Clears platform object and resets various values upon game end
    endGame(){
        this.platforms = {}
        this.playersReady = 0;
        this.isOpen = true
        this.gameStarted = false;
    }

    //Resets relevant info for new round
    newRound(){
        for (const key of Object.keys(this.players)) {
            this.players[key].x = 96,
            this.players[key].y = 535,
            this.players[key].placedThisRound = 0
        }
        this.resetGameTimers();
        this.pointsTimer = 6;
        this.pointsForFinishing = this.playerCount;
    }

}

//Builds and exports 9 rooms
const roomList = {}
for(let i = 1; i <= 9; i++){
    roomList[`room${i}`] = new Room();
}

module.exports = roomList
