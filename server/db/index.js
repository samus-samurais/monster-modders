const db = require("./db");
const User = require("./models/User");

module.exports = {
    db, 
    models: {User}
}