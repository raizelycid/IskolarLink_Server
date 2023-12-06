const express = require('express');
const router = express.Router();
const { Users, Students, COSOA_Members, COSOA_Profile, Application_Period } = require('../models');
const fs = require('fs');
const { ExpressFileuploadValidator} = require('express-fileupload-validator');
const upload = require('express-fileupload');
const cors = require('cors');

router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app'],
        credentials: true
    }
));


router.use(upload());

router.get('/get_cosoa_details', async (req, res) => {
    try{
        const cosoa_profile = await COSOA_Profile.findOne({
            where: {
                id: 1
            }
        });

        const application_period = await Application_Period.findOne({
            where: {
                id: 1
            }
        });
        cosoa_profile.dataValues.application_period = application_period.application_period;
        res.json(cosoa_profile);
    }catch(err){
        res.json(err);
    }
});

router.post('/update_cosoa_details', async (req, res) => {
    try{
        
        await COSOA_Profile.update({
            org_name: req.body.org_name,
            mission: req.body.mission,
            vision: req.body.vision,
            contact_number: req.body.contact_number,
            email: req.body.email,
            social1: req.body.social1,
            social2: req.body.social2,
            social3: req.body.social3,
            social4: req.body.social4
        },{
            where: {
                id: 1
            }
        });

        // If there is a file in org_picture then save it to the public folder
        if(req.files){
            const {org_picture} = req.files;
            const fullPath = `public/cosoa/${org_picture.name}`;
            org_picture.mv(fullPath);

            await COSOA_Profile.update({
                org_picture: org_picture.name
            },{
                where: {
                    id: 1
                }
            });
        }
        

        res.json('Successfully updated COSOA Profile');
    }catch(err){
        res.json(err);
    }
});




module.exports = router;