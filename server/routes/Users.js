const express = require('express');
const router = express.Router();
const { Users, Students } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const validateToken = require('../middleware/AuthMiddleware');

router.use(cookieParser());

router.post('/register', async (req, res) => {
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

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await Users.findOne({
            where: {
                email: email
            }
        });
        if (user) {
            const student = await Students.findOne({
                where: {
                    userId: user.id
                }
            });
            console.log(student)
            bcrypt.compare(password, user.password).then((match) => {
                if (match) {
                    if(user.role === "student"){
                        const name = student.student_Fname + " " + student.student_Lname;
                        console.log(name)
                        const accessToken = jwt.sign({ id: user.id, username: name, role: user.role, student_id: student.id, is_verified: student.is_verified, is_cosoa: student.is_cosoa, is_web_admin: student.is_web_admin }, 'spongebobsquarepants', { expiresIn: '1d' });

                        res.cookie("accessToken", accessToken, { httpOnly: true });
                        res.json(`Student logged in!`);
                    }else if(user.role === "organization"){
                        const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role },'spongebobsquarepants');
                        res.cookie("accessToken", accessToken, { maxAge: 3600 * 24 * 30 * 1000, httpOnly: true });
                        res.json(`Organization logged in!`);
                    }else{
                        res.json(`Wrong email or password!`);
                    }
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

router.get('/',validateToken, (req, res) => {
    const {id, username, profile_picture, role, student_id} = req.decoded;
    res.json({id: id, username: username, profile_picture: profile_picture, role: role, student_id: student_id});
});

router.post('/logout', validateToken, (req, res) => {
    res.clearCookie('accessToken');
    return res.json('User logged out!');
});
module.exports = router;