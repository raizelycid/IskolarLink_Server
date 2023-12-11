const express = require('express');
const router = express.Router();
const { Organization, Users, Students, COSOA_Members, Org_Application, Requirements, Advisers, Sequelize } = require('../models');
const cors = require('cors');

router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app'],
        credentials: true
    }
));


router.get('/get_orgs', async (req, res) => {

    
    try{
        // Get all organizations and order them by application_status starting from Accreditation, Revalidation, Accredited, Revalidated
        const orgs = await Organization.findAll({
            order: Sequelize.literal('CASE WHEN application_status = "Accreditation" THEN 1 WHEN application_status = "Revalidation" THEN 2 WHEN application_status = "Accredited" THEN 3 WHEN application_status = "Revalidated" THEN 4 END')
        });
        // Get every representative of each organization and add it to the orgs array
        for (let i = 0; i < orgs.length; i++){
            const user = await Users.findOne({
                where: {
                    id: orgs[i].userId
                }
            });

            
            if(user.role === "student"){
                const student = await Students.findOne({
                    where: {
                        userId: user.id
                    }
                });
                orgs[i].dataValues.representative = `${student.student_Fname} ${student.student_Mname[0]}. ${student.student_Lname}`;
                orgs[i].dataValues.photo = user.profile_picture;
                orgs[i].dataValues.role = user.role;
            }else{
                orgs[i].dataValues.representative = orgs[i].org_name;
                orgs[i].dataValues.photo = user.profile_picture;
                orgs[i].dataValues.role = user.role;
            }

            // Get the latest application of each organization and add it to the orgs array
            const org_application = await Org_Application.findOne({
                where: {
                    orgId: orgs[i].id
                },
                order: [
                    ['createdAt', 'DESC']
                ],
                limit: 1
            });

            orgs[i].dataValues.application = org_application;

            let new_subjurisdiction = ""
            if(orgs[i].dataValues.subjurisidiction !== 'University-Wide'){
                //Get only the last word in the string
                new_subjurisdiction = orgs[i].dataValues.subjurisdiction.split(" ");
                new_subjurisdiction = new_subjurisdiction[new_subjurisdiction.length - 1];
            }

            orgs[i].dataValues.subjurisdiction = new_subjurisdiction;
            new_subjurisdiction = "";

        }
        res.json(orgs);
    }catch(err){
        res.json(err);
    }
});

//Application_Page
router.get('/get_org/:id', async ( req, res) => {

    const Acc_Forms = ['AD001','AD002','AD003','AD004','AD005','AD006','AD007','AD008','AD009','AF001']
    const Rev_Forms = ['RD001','RD002','RD003','RD004','RD005','RD006','RD007','RD008','RD009','RD010','RD011','RD012','RD013','RF001']
    try{
        const orgId = req.params.id;
        const org = await Organization.findOne({
            where: {
                id: orgId
            }
        });
        const requirements = await Requirements.findAll({
            where: {
                orgId: orgId
            }
        });
        // Organize the requirements based on order in Forms array
        let organized_requirements = [];
        if (org.application_status === "Accreditation"){
            for(let i = 0; i < Acc_Forms.length; i++){
                for(let j = 0; j < requirements.length; j++){
                    if(requirements[j].requirement_name === Acc_Forms[i]){
                        organized_requirements.push(requirements[j]);
                    }
                }
            }
            const advisers = await Advisers.findAll({
                where: {
                    orgId: orgId
                }
            });
    
            // Concatenate the adviser's name separated by a ', '. adviser name is adviser_name
            let adviser_names = "";
            for(let i = 0; i < advisers.length; i++){
                adviser_names += advisers[i].adviser_name;
                if(i !== advisers.length - 1){
                    adviser_names += ", ";
                }
            }
    
            const user = await Users.findOne({
                where: {
                    id: org.userId
                }
            });

            const org_application = await Org_Application.findOne({
                where: {
                    orgId: org.id
                },
                order: [
                    ['createdAt', 'DESC']
                ],
                limit: 1
            });
    
            
            res.json({org, organized_requirements, adviser_names, user, org_application, requirements});
        }else if(org.application_status === "Revalidation"){
            for(let i = 0; i < Rev_Forms.length; i++){
                for(let j = 0; j < requirements.length; j++){
                    if(requirements[j].requirement_name === Rev_Forms[i]){
                        organized_requirements.push(requirements[j]);
                    }
                }
            }
            const advisers = await Advisers.findAll({
                where: {
                    orgId: orgId
                }
            });
    
            // Concatenate the adviser's name separated by a ', '. adviser name is adviser_name
            let adviser_names = "";
            for(let i = 0; i < advisers.length; i++){
                adviser_names += advisers[i].adviser_name;
                if(i !== advisers.length - 1){
                    adviser_names += ", ";
                }
            }
    
            const user = await Users.findOne({
                where: {
                    id: org.userId
                }
            });

            const org_application = await Org_Application.findOne({
                where: {
                    orgId: org.id
                },
                order: [
                    ['createdAt', 'DESC']
                ],
                limit: 1
            });

            if(org_application.application_status === "Revalidated"){
                res.json({error: "This organization still haven't applied for revalidation."});
            }else{
    
            
            res.json({org, organized_requirements, adviser_names, user, org_application, requirements});
            }
        }else if(org.application_status === "Accredited" || org.application_status === "Revalidated"){
            res.json({error: "This organization is already accredited or revalidated."});
        }
        
    }
    catch(err){
        res.json(err);
    }
});


// count all orgs where org_status is Active
router.get('/count_active_orgs', async (req, res) => {
    try{
        const orgs = await Organization.findAll({
            where: {
                org_status: "Active"
            }
        });
        res.json(orgs.length);
    }catch(err){
        res.json(err);
    }
});

// count all orgs where org_status is Pending
router.get('/count_pending_orgs', async (req, res) => {
    try{
        const orgs = await Organization.findAll({
            where: {
                org_status: "Pending"
            }
        });
        res.json(orgs.length);
    }catch(err){
        res.json(err);
    }
});

//count all org_application but only one per orgId
router.get('/count_org_application', async (req, res) => {
    try{
        const org_application_count = await Org_Application.count({
            distinct: true,
            col: 'orgId'
        });
        res.json(org_application_count);
    } catch(err) {
        res.json(err);
    }
});


// Merge all the pdf files of each organization and download it



module.exports = router;