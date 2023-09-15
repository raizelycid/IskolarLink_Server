const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const Users = require('../models/Users');

router.post('/addorg', async (req, res) => {
    const { org_name, jurisdiction, sub_jurisdiction, type} = req.body;
    try {
        const organization = await Organization.create({
            org_name: org_name,
            jurisdiction: jurisdiction,
            sub_jurisdiction: sub_jurisdiction,
            type: type,
            is_accredited: false,
            application_status: 'Accreditation',
            org_status: 'Pending',
            membership_period: false
        });
        
    } catch (err) {
        res.json(err);
    }
});

module.exports = router;

