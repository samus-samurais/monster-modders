const PORT = process.env.PORT || 8080;
const app = require('./app');
const socket = require('socket.io');
const seed = require("../script/seed.js");
const {db} = require("./db");

const init = async () => {
  try {
    if(process.env.SEED === 'true'){
      await seed();
    }
    else {
      await db.sync()
    }

    // start listening (and create a 'server' object representing our server)
    const server = app.listen(PORT, () =>
      console.log(`Mixing it up on port ${PORT}`)
    );

    // start socket connections
    //const io = socket(server);
    //require('./socket')(io);
  } catch (ex) {
    console.log(ex);
  }
};

init();