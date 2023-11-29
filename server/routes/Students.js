const express = require('express');
const router = express.Router();
const { Students, Users, Membership, Organization, Socials, Org_Application, Advisers, Requirements} = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const upload = require('express-fileupload');
const { ExpressFileuploadValidator} = require('express-fileupload-validator');
const checkPeriod = require('../middleware/App_Period');
const fs =require('fs');


const fileUploadValidator = new ExpressFileuploadValidator({
    minCount: 1,
    maxCount: 1,
    allowedExtensions: ['pdf'],
    allowedMimeTypes: ['application/pdf'],
    minFileSize: '1KB',
    maxFileSize: '600KB',
}, {
    minCount: 'You must upload a file.',
    maxCount: 'You can only upload 1 file',
    allowedExtensions: 'File must be in pdf',
    allowedMimetypes: 'File must be in pdf',
    minFileSize: 'File must be atleast 1KB',
    maxFileSize: 'File must not exceed 600KB',
});

const profilePicUploadValidator = new ExpressFileuploadValidator({
    minCount: 1,
    maxCount: 1,
    allowedExtensions: ['png','jpg','jpeg'],
    allowedMimeTypes: ['image/png','image/jpg','image/jpeg'],
    minFileSize: '1KB',
    maxFileSize: '3MB',
}, {
    minCount: 'You must upload a file.',
    maxCount: 'You can only upload 1 file',
    allowedExtensions: 'File must be in png, jpg, or jpeg',
    allowedMimetypes: 'File must be in png, jpg, or jpeg',
    minFileSize: 'File must be atleast 1KB',
    maxFileSize: 'File must not exceed 3MB',
});


router.use(upload());


// Count all students
router.get('/count', async (req, res) => {
    try {
        const student = await Students.count();
        res.json(student);
    } catch (err) {
        res.json(err);
    }
});

// Submit COR
router.post('/cor_upload',validateToken, async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.json('No files were uploaded.');
    }
    const {student_id} = req.decoded;
    const {cor} = req.files;
    try {
        fileUploadValidator.validate(cor);
        cor.mv(`cor/${student_id}.pdf`);
        res.json(`COR submitted!`);
    } catch (err) {
        res.json(err);
    }
});

router.post('/edit_name', validateToken, async (req, res) => {
    const {student_id} = req.decoded;
    const {
        student_Fname,
        student_Mname,
        student_Lname,
        student_suffix,
    } = req.body;

    let thingsToUpdate = {};
    
    // If the value is not "" then add it to the object
    if (student_Fname !== "") {
        thingsToUpdate.student_Fname = student_Fname;
    }
    if (student_Mname !== "") {
        thingsToUpdate.student_Mname = student_Mname;
    }
    if (student_Lname !== "") {
        thingsToUpdate.student_Lname = student_Lname;
    }

    try {
        await Students.update(thingsToUpdate, {
            where: {
                id: student_id,
            },
        });
        res.json('Name updated!');
    }catch (err) {
        res.json(err);
    }
});

router.post('/upload_profile_pic', validateToken, async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.json('No files were uploaded.');
    }
    const {student_id} = req.decoded;
    const {profile_pic} = req.files;
    try {
        profilePicUploadValidator.validate(profile_pic);
        const fullPath = `public/images/${student_id}.png`;
        profile_pic.mv(fullPath);
        
        await Users.update({profile_picture: `${student_id}.png`}, {
            where: {
                id: req.decoded.id,
            },
        });
        res.json(`Profile picture uploaded!`);
    } catch (err) {
        res.json(err);
    }
});


router.get('/affiliated_orgs', validateToken, async (req, res) => {
    const {student_id} = req.decoded;
    try{
        const orgs = await Membership.findAll({
            where: {
                studentId: student_id,
                status: "Accepted",
            },
        });

        let orgNames = [];

        for (let i = 0; i < orgs.length; i++) {
            const org = await Organization.findOne({
                where: {
                    id: orgs[i].orgId,
                },
            });
            
            orgNames.push(org.org_name);
        }   

        res.json([orgs, orgNames]);
    }catch(err){
        res.json(err);
    }
});


router.put('/update_socials', validateToken, async (req, res) => {
    const {id} = req.decoded;
    const {
        facebook,
        twitter,
        instagram,
        linkedin,
    } = req.body;

    let thingsToUpdate = {};

    // If the value is not "" then add it to the object
    if (facebook !== "") {
        thingsToUpdate.facebook = facebook;
    }
    if (twitter !== "") {
        thingsToUpdate.twitter = twitter;
    }
    if (instagram !== "") {
        thingsToUpdate.instagram = instagram;
    }
    if (linkedin !== "") {
        thingsToUpdate.linkedin = linkedin;
    }

    try{
        await Socials.update(thingsToUpdate, {
            where: {
                userId: id,
            },
        });
        res.json('Socials updated!');
    }catch(err){
        res.json(err);
    }
});

router.get('/accreditation_status', validateToken, async (req, res) => {
    const { id, role } = req.decoded;
    console.log(req.decoded);
    console.log(role);
    console.log("Hello World")
    try {
        console.log("attempting to search for organization")
        const org = await Organization.findOne({
            where: {
                userId: id,
            },
        });
        console.log(org)
        console.log("PASS 1")
        if (org === null) {
            console.log("it got no org homie!")
            res.json({ status: false });
        } else if (role == 'organization') {
            console.log("It got to organization")
            // Find the latest Org_Application for the organization
            const latestOrgApplication = await Org_Application.findOne({
                where: {
                    orgId: org.id,
                },
                order: [['createdAt', 'DESC']], // Order by createdAt in descending order to get the latest one
            });

            console.log(latestOrgApplication)

            // Check if there is a latest Org_Application and its application_status is "Accredited"
            if (latestOrgApplication && latestOrgApplication.application_status === 'Pending') {
                res.json({ status: true });
            } else {
                res.json({ status: false });
            }
        }else if (role == 'student'){
            console.log("it is a student!")
            res.json({status: true})
        }
    } catch (err) {
        res.json(err);
    }
});


router.get('/org_application_status', validateToken, async (req, res) => {
    const {id, student_id} = req.decoded;
    // get the latest application containing the user's id
    try{
        const org = await Organization.findOne({
            where: {
                userId: id,
            }
        });
        const org_app = await Org_Application.findOne({
            where: {
                orgId: org.id,
            },
            order: [['createdAt', 'DESC']],
            limit: 1,
        });

        const requirements = await Requirements.findAll({
            where: {
                orgId: org.id,
            },
        });
        
        const advisers = await Advisers.findAll({
            where: {
                orgId: org.id,
            },
        });

        res.json({org_app, org, requirements, advisers});
    }
    catch(err){
        res.json(err);
    }
});


router.post('/update_form/:org_id/:requirementId', [validateToken, checkPeriod], async (req, res) => {
    const { org_id, requirementId } = req.params;
    const file = req.files.file;
    const {requirement_name} = req.body;
    const {role} = req.decoded
    console.log(file)
    console.log(requirement_name)
    try{
        fileUploadValidator.validate(file);
        if(role === 'student'){
        const filePath = `org_applications/accreditation/${org_id}/${requirement_name}.pdf`;
        fs.writeFile(filePath, file.data, (err) => {if(err){console.log(err)}console.log(filePath)});
        }else if(role === 'organization'){
            const filePath = `org_applications/revalidation/${org_id}/${requirement_name}.pdf`;
            fs.writeFile(filePath, file.data, (err) => {if(err){console.log(err)}console.log(filePath)});
        }
        await Requirements.update({
            status: 'Revised',
            feedback: '',
        },{
            where: {
                id: requirementId,
            }
        });

        // Check if there are no more requirements that are Pending and Revision. If there are none, then create an of org application with a feedback 'Revision Complete'
        const org = await Organization.findOne({
            where: {
                id: org_id,
            },
        });
        const requirements = await Requirements.findAll({
            where: {
                orgId: org_id,
            },
        });
        const org_app = await Org_Application.findOne({
            where: {
                orgId: org_id,
            },
            order: [['createdAt', 'DESC']],
            limit: 1,
        });
        let pending = false;
        let revision = false;
        for(let i = 0; i < requirements.length; i++){
            if(requirements[i].status === 'Pending'){
                pending = true;
            }
            if(requirements[i].status === 'Revision'){
                revision = true;
            }
        }
        if(!pending && !revision){
            await Org_Application.create({
                orgId: org.id,
                cosoaId: org_app.cosoaId,
                studentId: org_app.studentId,
                application_status: org_app.application_status,
                feedback: 'Revision Complete',
            });
        }

        res.json({message: 'Successfully updated form'})
    }catch(err){
        res.json(err);
        console.log(err);
    }
});

module.exports = router;