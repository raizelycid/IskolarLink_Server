const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users, Membership, Students, Socials, Org_Announcement } = require('../models');

router.get('/:orgId', async (req, res) => {
    const {orgId} = req.params;
    try{
        const organization = await Organization.findOne({
            where: {id: orgId}
        });

        // only get email,profile_picture,description
        const user = await Users.findOne({
            attributes: ['email','profile_picture','description'],
            where: {id: organization.userId}
        });

        const socials = await Socials.findOne({
            where: {userId: organization.userId}
        });

        res.json({organization: organization, user: user, socials: socials});
    }catch(err){
        res.json(err);
    }
});

router.get('/get_announcements/:orgId', async (req, res) => {
    const {orgId} = req.params;
    try{
        // get only the userId of the organization
        const org = await Organization.findOne({
            attributes: ['userId'],
            where: {id: orgId}
        });

        const announcements = await Org_Announcement.findAll({
            where: {orgId: org.userId}
        });
        res.json(announcements);
    }catch(err){
        res.json(err);
    }
});


module.exports = router;
