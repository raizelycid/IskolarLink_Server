const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users, Students, Socials } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const checkPeriod = require('../middleware/App_Period');
const fs =require('fs');
const upload = require('express-fileupload');
const {readFile,writeFile} = require('fs/promises');
const bcrpyt = require('bcrypt');
const cookieParser = require('cookie-parser');

router.use(cookieParser());
router.use(upload());

router.get('/', validateToken, async (req, res) => {
    const { id, student_id } = req.decoded;
    try {
        const student = await Students.findOne({
            where: { userId: id }   
        });

        // get only the email attribute from the user table
        const email = await Users.findOne({
            attributes: ['email', 'description','profile_picture'],
            where: { id: id }
        });

        const socials = await Socials.findOne({
            where: { userId: id }
        });

        student.dataValues.email = email.dataValues.email;
        student.dataValues.description = email.dataValues.description;
        student.dataValues.profile_picture = email.dataValues.profile_picture;
        student.dataValues.facebook = socials.dataValues.facebook;
        student.dataValues.twitter = socials.dataValues.twitter;
        student.dataValues.instagram = socials.dataValues.instagram;
        student.dataValues.linkedin = socials.dataValues.linkedin;

        res.json(student);

    } catch (err) {
        res.json(err);
    }
});

router.post('/update_profile', validateToken, async (req, res) => {
    const {id} = req.decoded;
    const {description, currentPassword, newPassword, facebook, twitter, instagram, linkedin} = req.body;
    try{
        if(req.files.profile_picture){
            const file = req.files.profile_picture;
            const fileName = `${id}_${file.name}`
            const fullPath = `./public/images/${fileName}`;
            file.mv(fullPath, async (err) => {
                if(err){
                    console.log(err);
                    res.json(err);
                }else{
                    await Users.update({
                        profile_picture: fileName
                    },{
                        where: {
                            id: id
                        }
                    });
                }
            });
        }

        if(req.files.cor){
            const file2 = req.files.cor;
            // get only the file extension of the file
            const fileExtension = file2.name.split('.').pop();
            const fileName2 = `${id}.${fileExtension}`;
            const fullPath2 = `./cor/${fileName2}`;
            file2.mv(fullPath2, async (err) => {
                if(err){
                    console.log(err);
                    res.json(err);
                }else{
                    await Students.update({
                        cor: fileName2
                    },{
                        where: {
                            userId: id
                        }
                    });
                }
            });
        }


        if(description !== ""){
            await Users.update({
                description: description
            },{
                where: {
                    id: id
                }
            });
        }

        if(currentPassword !== "" && newPassword !== ""){
            const user = await Users.findOne({
                where: {
                    id: id
                }
            });

            const passwordMatch = await bcrpyt.compare(currentPassword, user.password);

            if(passwordMatch){
                const hashedPassword = await bcrpyt.hash(newPassword, 10);
                await Users.update({
                    password: hashedPassword
                },{
                    where: {
                        id: id
                    }
                });
            }else{
                res.json({error: 'Incorrect password'});
                return;
            }
        }

        const socials = await Socials.findOne({
            where: {
                userId: id
            }
        });

        if(socials){
            await Socials.update({
                facebook: facebook,
                twitter: twitter,
                instagram: instagram,
                linkedin: linkedin
            },{
                where: {
                    userId: id
                }
            });
        }else{
            await Socials.create({
                facebook: facebook,
                twitter: twitter,
                instagram: instagram,
                linkedin: linkedin,
                userId: id
            });
        }

        res.json('Successfully updated profile');

        }catch(err){
            res.json(err);
        }
});





module.exports = router;