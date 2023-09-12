const express = require('express');
const router = express.Router();
const { Users } = require('../models');
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        bcrypt.hash(password, 10).then((hash) => {
            Users.create({
                email: email,
                password: hash,
                role: role
            });
            res.json(`User created!`);
        });

    } catch (err) {
        res.json(err);
    }
});

router.get('/', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await Users.findOne({
            where: {
                email: email
            }
        });
        if (user) {
            bcrypt.compare(password, user.password).then((match) => {
                if (match) {
                    res.json(`User logged in!`);
                } else {
                    res.json(`Wrong email or password!`);
                }
            });
        } else {
            res.json(`User not found!`);
        }
    } catch (err) {
        res.json(err);
    }
});

module.exports = router;