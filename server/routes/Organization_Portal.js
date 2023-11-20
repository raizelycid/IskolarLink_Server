const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');


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
        res.json({organization: organization, user: user});
    }catch(err){
        res.json(err);
    }
});




module.exports = router;