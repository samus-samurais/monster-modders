const path = require("path");
const express = require("express");
const morgan = require("morgan");
const app = express();
const PORT = process.env.PORT || 8080;
const socket = require('socket.io');
module.exports = app;

// logging middleware
app.use(morgan('dev'));

// body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res)  => res.sendFile(path.join(__dirname, '..', 'public/index.html')));

// static file-serving middleware
app.use(express.static(path.join(__dirname, '..', 'public')));

// any remaining requests with an extension (.js, .css, etc.) send 404
app.use((req, res, next) => {
  if (path.extname(req.path).length) {
    const err = new Error('Not found')
    err.status = 404
    next(err)
  } else {
    next()
  }
});

// sends index.html
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/index.html'));
});

// error handling endware
app.use((err, req, res, next) => {
  console.error(err)
  console.error(err.stack)
  res.status(err.status || 500).send(err.message || 'Internal server error.')
});

const init = () => {
    try {
        const server = app.listen(PORT, () => {
            console.log(`Mixing it up on port ${PORT}`)
        });

        // start socket connections
        const io = socket(server);
        require('./sockets')(io);
    } catch (error) {
        console.log(error);
    }

}

init();