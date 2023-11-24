const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users, Students, Socials, Membership} = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const checkPeriod = require('../middleware/App_Period');
const fs =require('fs');
const upload = require('express-fileupload');
const bcrpyt = require('bcryptjs');
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

        // find all memberships where status is Accepted
        const memberships = await Membership.findAll({
            where: {
                studentId: student_id,
                status: 'Accepted'
            }
        });

        
        // find all orgs where the student is a member. get only the org_name and id attribute
        const orgs = await Organization.findAll({
            attributes: ['org_name', 'userId'],
            where: {
                id: memberships.map((membership) => {
                    return membership.orgId;
                })
            }
        });


        // get only the profile_picture and description attribute from the user table
        const orgInfo = await Users.findAll({
            attributes: ['profile_picture', 'description'],
            where: {
                id: orgs.map((org) => {
                    return org.userId;
                })
            }
        });

        console.log(orgInfo)


        student.dataValues.email = email.dataValues.email;
        student.dataValues.description = email.dataValues.description;
        student.dataValues.profile_picture = email.dataValues.profile_picture;
        if(socials){
        student.dataValues.facebook = socials.dataValues.facebook;
        student.dataValues.twitter = socials.dataValues.twitter;
        student.dataValues.instagram = socials.dataValues.instagram;
        student.dataValues.linkedin = socials.dataValues.linkedin;
        }
        if(orgs){
        student.dataValues.orgs = orgs;
        student.dataValues.orgs.map((org, index) => {
            org.dataValues.profile_picture = orgInfo[index].dataValues.profile_picture;
            org.dataValues.description = orgInfo[index].dataValues.description;
        });
        }

        res.json(student);

    } catch (err) {
        res.json(err);
    }
});

router.post('/update_profile', validateToken, async (req, res) => {
    const {id} = req.decoded;
    const {description, currentPassword, newPassword, facebook, twitter, instagram, linkedin} = req.body;
    console.log(req.body)
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

        console.log(facebook)
        console.log(twitter)
        console.log(instagram)
        console.log(linkedin)

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

        res.json({success:'Successfully updated profile'});

        }catch(err){
            res.json(err);
        }
});





module.exports = router;