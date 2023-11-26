const express = require('express');
const router = express.Router();
const { Users, Students, Organization, Org_Application } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const validateToken = require('../middleware/AuthMiddleware');
const cors = require('cors');

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
            console.log("User found!")
            let student = "";
            let org = "";
            if (user.role === 'student'){
            const student_client = await Students.findOne({
                where: {
                    userId: user.id
                }
            }).then((student_client) => {
                student = student_client;});
            }else if(user.role === 'organization'){
            const org_client = await Organization.findOne({
                where: {
                    userId: user.id
                }   
            // find the latest application of the organization
                
            }).then((org_client) => {
                console.log("Organization found!")
                org = org_client;});
            const org_application = await Org_Application.findOne({
                    where: {
                        orgId: org.id
                    },
                    order: [['createdAt', 'DESC']]
                });
            console.log("Organization application found!")

            if(org.org_status === "Pending" && (org_application.application_status === "Accredited" || org_application.application_status === "Revalidated")){
                org.show_application = 1;
            }else if(org.org_status === "Pending"){
                org.show_application = 2;
            }else{
                org.show_application = 0;
            }
        }
            await bcrypt.compare(password, user.password).then((match) => {
                if (match) {
                    if(user.role === "student"){
                        console.log("Student logged in!")
                        const name = student.student_Fname + " " + student.student_Lname;
                        const accessToken = jwt.sign({ id: user.id, username: name, role: user.role, student_id: student.id, is_verified: student.is_verified, is_cosoa: student.is_cosoa, is_web_admin: student.is_web_admin }, 'spongebobsquarepants', { expiresIn: expiry });
                        res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: 'none', secure: true });
                        res.json({student:`Student logged in!`});
                    }else if(user.role === "organization"){
                        console.log("Creating Cookie for Organization")
                        const accessToken = jwt.sign({ id: user.id, username: org.org_name, profile_picture: user.profile_picture, role: user.role, show_application: org.show_application },'spongebobsquarepants', { expiresIn: expiry });
                        res.cookie("accessToken", accessToken, { maxAge: 3600 * 24 * 30 * 1000, httpOnly: true, sameSite: 'none', secure: true });
                        const menuCookies = jwt.sign({ menu: 'org' }, 'spongebobsquarepants', {
                            expiresIn: '1d'
                        });
                        res.cookie('menuToken', menuCookies, { httpOnly: true, sameSite: 'none', secure: true });
                        res.json({org: org});
                    }else{
                        res.json(`Wrong email or password!`);
                    }
                } else {
                    res.json({error:`Wrong email or password!`});
                }
            });
        } else {
            res.json({error:`User not found!`});
        }
    } catch (err) {
        res.json(err);
    }
});

router.get('/', validateToken, async (req, res) => {
    const { id, username, role} = req.decoded;
    if(role === "student"){
        const { student_id, is_verified, is_cosoa, is_web_admin } = req.decoded;
        try{
            const user = await Users.findOne({
                where: {
                    id: id
                }
            });
            const profile_picture = user.profile_picture;
            res.json({ id: id, username: username, profile_picture: profile_picture, role: role, student_id: student_id, is_verified: is_verified, is_cosoa: is_cosoa, is_web_admin: is_web_admin });
        }catch(err){
            console.log(err);
            res.json(err);
        }
    }else if(role === "organization"){
        const { show_application } = req.decoded;
        try{
            const user = await Users.findOne({
                where: {
                    id: id
                }
            });
            const profile_picture = user.profile_picture;
            res.json({ id: id, username: username, profile_picture: profile_picture, role: role, show_application: show_application });
        }catch(err){   
            console.log(err);
            res.json(err);
        }
    }else{
        res.json({error: "User not found!"});
    }
});


router.post('/add_org/:orgId', validateToken, async (req, res) => {
    const {email, password} = req.body;
    const {orgId} = req.params;
    try{
        await bcrypt.hash(password, 10).then((hash) => {
            const user = Users.create({
                email: email,
                password: hash,
                role: 'organization',
            }).then((user) => {
                const userId = user.id;
                Organization.update({
                    userId: userId,
                },{
                    where: {
                        id: orgId,
                    }
                });
            });
        });

        
        res.json('Organization created!');
    }catch(err){
        res.json(err);
    }
});

router.post('/logout', validateToken, (req, res) => {
    res.clearCookie('accessToken', { httpOnly: true, sameSite: 'none', secure: true });
    res.clearCookie('menuToken', { httpOnly: true, sameSite: 'none', secure: true });
    return res.json('User logged out!');
});
module.exports = router;