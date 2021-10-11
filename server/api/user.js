const router = require("express").Router();
const {
    models: {User}
} = require("../db");
module.exports = router;

//middleware needed here

router.get("/", async (req, res, next) => {
    try {
        const users = await User.findAll({attributes: ['id', 'username', 'email', 'number_of_wins']});
        res.json(users);
    } catch (error) {
        next(error);
    }
});

router.get("/:userId", async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.userId, {
            attributes: ['id', 'username', 'email', 'number_of_wins']
        });
        res.json(user);
    } catch (error) {
        next(error);
    }
});

// below code are not working yet, still trying to test
// router.post('/login', async (req, res, next) => {
//   try {
//     res.send({ token: await User.authenticate(req.body) });
//   } catch (err) {
//     next(err);
//   }
// });

// router.post('/signup', async (req, res, next) => {
//   try {
//     const user = await User.create(req.body);
//     res.send({ token: await user.generateToken() });
//   } catch (error) {
//     if (error.name === 'SequelizeUniqueConstraintError') {
//       res.status(401).send('username/email already in use')
//   } else {
//       next(error)
//   }
//   }
// });

router.post("/", async (req, res, next) => {
    try {
        const {id, username, email,  number_of_wins} = await User.create(req.body);
        res.json({id, username, email, number_of_wins});
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(401).send('username/email already in use')
        } else {
            next(error)
        }
    }
});

router.put("/:userId", async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.userId);
        await user.update(req.body);
        res.status(200).json(user);
    } catch (error) {
        next(error)
    }
})
