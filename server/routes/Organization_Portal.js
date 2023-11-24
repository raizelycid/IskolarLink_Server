const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users, Membership, Students, Socials, Org_Announcement } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
// import all necessary libarry for file upload
const fs = require('fs');
const fileUpload = require('express-fileupload');

router.use(fileUpload());

router.use(cookieParser());


//Get all organization details
router.get('/organization', validateToken, async (req, res) => {
    const {id} = req.decoded;
    try{
        const organization = await Organization.findOne({
            where: {userId: id}
        });

        const user = await Users.findOne({
            where: {id: id}
        });

        const socials = await Socials.findOne({
            where: {userId: id}
        });
        if(socials){
            res.json({organization: organization, user: user, socials: socials});
        }else{
            res.json({organization: organization, user: user});
        }
    }catch(err){
        res.json(err);
    }
});


router.get('/organization/members', validateToken, async (req, res) => {
    const {id} = req.decoded;
    try{
        const organization = await Organization.findOne({
            where: {userId: id}
        });


        const members = await Membership.findAll({
            where: {orgId: organization.id, status: 'Accepted'}
        });

        for(let i = 0; i < members.length; i++){
            const student = await Students.findOne({
                where: {id: members[i].studentId}
            });
            members[i].dataValues.details = student;
        }



        res.json(members);
    }catch(err){
        res.json(err);
    }
});

router.get('/organization/membership', validateToken, async (req, res) => {
    const {id} = req.decoded;
    try{
        const organization = await Organization.findOne({
            where: {userId: id}
        });

        const members = await Membership.findAll({
            where: {orgId: organization.id, status: 'Pending'}
        });

        for(let i = 0; i < members.length; i++){
            const student = await Students.findOne({
                where: {id: members[i].studentId}
            });
            members[i].dataValues.details = student;
        }

        for(let i=0; i < members.length; i++){
            // get only the email
            const student = await Users.findOne({
                where: {id: members[i].dataValues.details.userId}
            });

            members[i].dataValues.email = student.email;
        }

        res.json(members);
    }catch(err){
        res.json(err);
    }
});


router.post('/organization/settings', validateToken, async (req, res) => {
    const {id} = req.decoded;
    const {profile_picture, mission, vision, currentPassword, newPassword, facebook, twitter, instagram, linkedin} = req.body;
    try{
        const org = await Organization.update(
            {
                mission: mission,
                vision: vision
            },
            {
                where: {userId: id}
            }
        )

        // Check if currentPassword and newPassword is not empty
        if(currentPassword && newPassword){
            const user = await Users.findOne({
                where: {id: id}
            });

            const passwordMatch = await bcrypt.compare(currentPassword, user.password);

            if(passwordMatch){
                await bcrypt.hash(newPassword, 10).then((hash) => {
                    Users.update(
                        {
                            password: hash,
                        },
                        {
                            where: {id: id}
                        }
                    );
                });
            }else{
                res.json('Wrong password!');
            }
        }

        // Check if socials data for the user exists if not create one
        const userSocials = await Socials.findOne({
            where: {userId: id}
        });

        if(userSocials){
            await Socials.update(
                {
                    facebook: facebook,
                    twitter: twitter,
                    instagram: instagram,
                    linkedin: linkedin,
                },
                {
                    where: {userId: id}
                }
            )
        }else{
            await Socials.create({
                facebook: facebook,
                twitter: twitter,
                instagram: instagram,
                linkedin: linkedin,
                userId: id,
            });
        }

        if(req.files){
            const file = req.files.profile_picture;
            const fileName = `${id}_${file.name}`;
            const filePath = `./public/org_images/${fileName}`;
            const fileUrl = `http://localhost:3001/org_images/${fileName}`;
            file.mv(filePath, async (err) => {
                if(err){
                    console.log(err);
                }else{
                    await Users.update(
                        {
                            profile_picture: fileName,
                        },
                        {
                            where: {id: id}
                        }
                    );
                }
            });
        }

        res.json(true);
    }catch(err){
        res.json(err);
    }
});


router.post('/add_announcement', validateToken, async (req, res) => {
    const {id} = req.decoded;
    const {org_ann_title, org_ann_body, org_ann_link} = req.body;
    const {org_ann_photo} = req.files;
        const org_ann = await Org_Announcement.create({
            org_ann_title: org_ann_title,
            org_ann_link: org_ann_link,
            org_ann_body: org_ann_body,
            orgId: id,
        })
        .catch((err) => {
            console.log(err)
            res.json({error: err});
        });
        if(org_ann_photo){
            const fullPath = `./public/org_announcements/${org_ann_photo.name}`;
            org_ann_photo.mv(fullPath);
            await Org_Announcement.update({
                org_ann_photo: org_ann_photo.name,
            },
            {
                where: {id: org_ann.id}
            });
        }
        res.json({success: "Announcement Added!"});
});


router.get('/get_announcements', validateToken, async (req, res) => {
    const {id} = req.decoded;
    try{
        const announcements = await Org_Announcement.findAll({
            where: {orgId: id},
            order: [['createdAt', 'DESC']],
            limit: 3
        });
        res.json(announcements);
    }catch(err){
        res.json(err);
    }
});
       

module.exports = router;