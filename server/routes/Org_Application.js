const express = require('express');
const router = express.Router();
const { Org_Application, Advisers } = require('../models');
const fs = require('fs');



// Create an org application and pass studentId as a foreign key
router.post('/accreditation', async (req, res) => {
    const {studentId, orgId, advisers} = req.body;
    try{
        const org_application = await Org_Application.create({
            studentId: studentId,
            orgId: orgId,
            application_status: 'Pending',
        });

        // Create Adviser for Each Adviser
        for (let i = 0; i < advisers.length; i++){
            await Advisers.create({
                adviser_name: advisers[i].adviser_name,
                orgId: orgId
            });
        }
        if (!fs.existsSync(`../org_applications/accreditation/${orgId}`)){
            fs.mkdirSync(`../org_applications/accreditation/${orgId}`);
        }
        res.json(org_application);
    }
    catch(err){
        res.json(err);
    }
});

module.exports = router;