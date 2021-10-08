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
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'username', 'email', 'number_of_wins']
        });
        res.json(user);
    } catch (error) {
        next(error);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const user = await User.create(req.body);
        res.json(user);
    } catch (error) {
        next(error)
    }
});

router.put("/:userId", async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        await user.update(req.body);
        res.status(200).json(user);
    } catch (error) {
        next(error)
    }
})