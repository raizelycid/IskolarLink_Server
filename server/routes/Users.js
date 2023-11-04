const express = require('express');
const router = express.Router();
const { Users, Students } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const validateToken = require('../middleware/AuthMiddleware');

router.use(cookieParser());

router.post('/register', async (req, res) => {
    const { email, password, student_num,
        student_Lname,
        student_Fname,
        student_Mname,
        student_suffix,
        department,
        year_level } = req.body;

    try {
        await bcrypt.hash(password, 10).then((hash) => {
            const user = Users.create({
                email: email,
                password: hash,
                role: 'student',
            }).then((user) => {

                const userId = user.id;
                const student = Students.create({
                    student_num: student_num,
                    student_Lname: student_Lname,
                    student_Fname: student_Fname,
                    student_Mname: student_Mname,
                    student_suffix: student_suffix,
                    department: department,
                    year_level: year_level,
                    is_verified: false,
                    is_cosoa: false,
                    is_web_admin: false,
                    userId: userId
                });
            });

        res.json(`Student created!`);
        });

        
        

    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            res.json(`Student number already exists!`);
        }else{
            res.json(err);
        }
    }
});

router.post('/login', async (req, res) => {
    const { email, password, keepLoggedIn } = req.body;
    let expiry = "";
    if (keepLoggedIn) {
        expiry = '30d';
    }else{
        expiry = '1d';
    }

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
            bcrypt.compare(password, user.password).then((match) => {
                if (match) {
                    if(user.role === "student"){
                        const name = student.student_Fname + " " + student.student_Lname;
                        const accessToken = jwt.sign({ id: user.id, username: name, role: user.role, student_id: student.id, is_verified: student.is_verified, is_cosoa: student.is_cosoa, is_web_admin: student.is_web_admin }, 'spongebobsquarepants', { expiresIn: expiry });
                        res.cookie("accessToken", accessToken, { httpOnly: true });
                        res.json(`Student logged in!`);
                    }else if(user.role === "organization"){
                        const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role },'spongebobsquarepants', { expiresIn: expiry });
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

router.get('/', validateToken, async (req, res) => {
    const { id, username, role, student_id, is_cosoa, is_web_admin } = req.decoded;
    try {
        const user = await Users.findOne({
            where: {
                id: id
            }
        });
        const profile_picture = user.profile_picture;
        console.log(is_cosoa)
        res.json({ id: id, username: username, profile_picture: profile_picture, role: role, student_id: student_id, is_cosoa: is_cosoa, is_web_admin: is_web_admin });
    } catch (err) {
        console.log(err);
        res.json(err);
    }
});

router.post('/logout', validateToken, (req, res) => {
    res.clearCookie('accessToken');
    return res.json('User logged out!');
});
module.exports = router;