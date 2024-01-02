const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users, Membership, Students, Socials, Org_Announcement, COSOA_Members, Application_Period } = require('../models');
const { Op, where } = require('sequelize');
const fs = require('fs');
const validateToken = require('../middleware/AuthMiddleware');
const cors = require('cors');

router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app', 'https://iskolarlink.com'],
        credentials: true
    }
));


router.get('/section2', async (req,res)=>{
    let section2 = {}
    const orgs = await Organization.findAndCountAll({
        where:{
            is_accredited:true,
        }
    })

    const students = await Students.findAndCountAll()

    const orgs2 = await Organization.findAndCountAll({
        where:{
            is_accredited:true,
            type:"Academic Organization"
        }
    })

    

    section2.orgs = orgs.count
    section2.students = students.count
    section2.academics = orgs2.count



    res.json(section2)
})

router.get('/application_period', async (req, res) =>{
    const profile = await Application_Period.findOne({
        where: {id:1}
    })

    if(profile.application_period){
        return res.json({status:true})
    }else{
        return res.json({status: false})
    }
})




module.exports=router