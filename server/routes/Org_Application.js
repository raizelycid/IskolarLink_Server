const express = require('express');
const router = express.Router();
const { Org_Application, Advisers } = require('../models');
const fs = require('fs');
const validateToken = require('../middleware/AuthMiddleware')



// Create an org application and pass studentId as a foreign key
router.post('/accreditation', validateToken, async (req, res) => {
    const {orgId, advisers} = req.body;
    const studentId = req.decoded.student_id;
    try{
        const org_application = await Org_Application.create({
            studentId: studentId,
            orgId: orgId,
            application_status: 'Pending',
        });

        // Create Adviser for Each Adviser
        for (let i = 0; i < advisers.length; i++){
            await Advisers.create({
                adviser_name: advisers[i],
                orgId: orgId
            });
        }
        if (!fs.existsSync(`./org_applications/accreditation/${orgId}`)){
            fs.mkdirSync(`./org_applications/accreditation/${orgId}`);
        }
        res.json(org_application + `\n` + advisers + `\n` + `Org Application Created!`);
    }
    catch(err){
        res.json(err);
    }
});

module.exports = router;