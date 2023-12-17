const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users, Membership, Students, Socials, Org_Announcement } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const cors = require('cors');

router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app', 'http://iskolarlink.com'],
        credentials: true
    }
));

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

router.get('/has_joined/:orgId', validateToken , async (req,res)=>{
    const {student_id} = req.decoded
    const {orgId} = req.params

    const membership = await Membership.findOne({
        where:{studentId:student_id, orgId:orgId}
    })

    if(membership){
        return res.json({applied:true})
    }else{
        return res.json({applied:false})
    }
})

router.post('/delete_membership/:orgId', validateToken, async (req,res)=>{
    const {student_id} = req.decoded;
    const {orgId} = req.params;

    console.log("Finding Membership...")

    const membership = await Membership.findOne({
        where:{studentId:student_id, orgId:orgId}
    })


    let message;

    if(membership.status === "Pending"){
        message = "Your membership application has now been removed."
    }else{
        message = "You membership has now been removed."
    }

    await membership.destroy();

    res.json({success:message})
})


module.exports = router;
