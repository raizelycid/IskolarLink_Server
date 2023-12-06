const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users, Membership, Students, Socials, Org_Announcement, COSOA_Members } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const validateToken = require('../middleware/AuthMiddleware');
const cors = require('cors');

router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app'],
        credentials: true
    }
));


// get orgId and studentId from req.body and add to Membership table
router.post('/apply',validateToken, async (req, res) => {
    const {orgId, strict} = req.body;
    const {student_id} = req.decoded;
    let studentId = student_id;
    try{
        //get student department
        const student = await Students.findOne({
            attributes: ['id', 'department'],
            where: {id: studentId}
        });

        //get organization department
        const organization = await Organization.findOne({
            attributes: ['id', 'subjurisdiction'],
            where: {id: orgId}
        });
        
        //check if there is already a membership under the student and organization
        const membership = await Membership.findOne({
            where: {
                orgId: orgId,
                studentId: studentId
            }
        });

        if(membership){
            res.json({error: 'You have already applied to this organization'});
        }else{


        //if strict is true, check if student department is equal to organization department
        if(strict){
            if(student.department === organization.subjurisdiction){
                const member = await Membership.create({
                    orgId: orgId,
                    studentId: studentId,
                    status: 'Pending'
                });
                res.json({success: 'Successfully applied to organization'});
            }else{
                res.json({error: 'Your department is not under this organization\'s jurisdiction'});
            }
        }else{
            const member = await Membership.create({
                orgId: orgId,
                studentId: studentId,
                status: 'Pending'
            });
            res.json({success: 'Successfully applied to organization'});
        }
    }

    }catch(err){
        res.json(err);
    }
});


// accept or reject membership
router.post('/membership', validateToken, async (req, res) => {
    const {studentId, status, orgId} = req.body;
    console.log(req.body);
    try{

        
        await Membership.update({
            status: status
        }, {
            where: {
                studentId: studentId,
                orgId: orgId
            }
        }); 
        if(status === 'Accepted'){
            res.json({success: 'Successfully accepted applicant'});
        }else{
            res.json({success: 'Successfully rejected applicant'});
        }
    }catch(error){
        res.json(error);
    }
});


//remove member
router.post('/remove_member', validateToken, async (req, res) => {
    const {id} = req.decoded;

    const organization = await Organization.findOne({
        attributes:['id'],
        where: {userId: id}
    });
    let orgId = organization.id;
    const {studentId} = req.body;
    console.log(req.body);
    console.log(orgId);
    try{
        await Membership.destroy({
            where: {
                studentId: studentId,
                orgId: orgId
            }
        });
        res.json({success: 'Successfully removed member'});
    }catch(error){
        res.json(error);
    }
});

module.exports = router;