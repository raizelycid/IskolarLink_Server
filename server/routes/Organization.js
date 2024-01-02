const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users,Students } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const checkPeriod = require('../middleware/App_Period');
const fs =require('fs');
const { ExpressFileuploadValidator} = require('express-fileupload-validator');
const upload = require('express-fileupload');
const {PDFDocument} = require('pdf-lib');
const {readFile,writeFile} = require('fs/promises');
const {Op} = require('sequelize');
const cookieParser = require('cookie-parser');
const cors = require('cors');
router.use(cookieParser());

router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app', 'https://iskolarlink.com'],
        credentials: true
    }
));


router.use(upload());

const fileUploadValidator = new ExpressFileuploadValidator({
    minCount: 1,
    maxCount: 1,
    allowedExtensions: ['pdf'],
    allowedMimeTypes: ['application/pdf'],
    minFileSize: '1KB',
    maxFileSize: '600KB',
}, {
    minCount: 'You must upload a file.',
    maxCount: 'Tou can only upload 1 file',
    allowedExtensions: 'File must be in pdf',
    allowedMimetypes: 'File must be in pdf',
    minFileSize: 'File must be atleast 1KB',
    maxFileSize: 'File must not exceed 600KB',
});

const forms = ['AD001','AD002','AD003','AD004','AD004X','AD005','AD006','AD007','AD009','AF001']


router.post('/addorg', [validateToken, checkPeriod], async (req, res) => {
    const { orgName, jurisdiction, subjurisdiction, orgType, advisers} = req.body;
    const { id, student_id } = req.decoded;
    const files = req.files;
    try {

        const organization = await Organization.create({
            org_name: orgName,
            jurisdiction: jurisdiction,
            subjurisdiction: subjurisdiction,
            type: orgType,
            is_accredited: false,
            application_status: 'Accreditation',
            org_status: 'Pending',
            membership_period: false,
            userId: id,
        });

        const orgId = organization.id;

        const org_application = await Org_Application.create({
            studentId: student_id,
            orgId: orgId,
            application_status: 'Pending',
        });

        // convert advisers to array
        let advisers_array = advisers.split(',');
        
        // Create Adviser for Each Adviser
        for (let i = 0; i < advisers_array.length; i++){
            await Advisers.create({
                adviser_name: advisers_array[i],
                orgId: orgId
            });
        }
        if (!fs.existsSync(`org_applications/accreditation/${orgId}`)){
            fs.mkdirSync(`org_applications/accreditation/${orgId}`);
        }

        
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.json('No files were uploaded.');
        }
        for (const fieldNames in files) {
            const file = files[fieldNames];
            fileUploadValidator.validate(file);
            const filePath = `org_applications/accreditation/${orgId}/${fieldNames}.pdf`;
            await file.mv(filePath);
            await Requirements.create({
                orgId: orgId,
                requirement_name: fieldNames,
                requirement: fieldNames + '.pdf',
            });
        }

        const student = await Students.findOne({
            where: {userId: id}
        });

        student.has_created = true;

        await student.save();

        
        res.json({organization: organization});
        
    } catch (err) {
        res.json(err);
        console.log(err);
    }
});

router.post('/revalidation', [validateToken, checkPeriod], async (req, res) => {
    const { id} = req.decoded;
    const { orgName, jurisdiction, subjurisdiction, type, advisers} = req.body;
    try{
        const org = await Organization.findOne({
            where: {
                userId: id
            }
        });
        if (orgName != org.org_name || jurisdiction != org.jurisdiction || subjurisdiction != org.subjurisdiction || type != org.type){
            await Organization.update({
                org_name: orgName,
                jurisdiction: jurisdiction,
                subjurisdiction: subjurisdiction,
                type: type,
            },{
                where: {
                    userId: id
                }
            });
        }
        const org_application = await Org_Application.create({
            orgId: org.id,
            application_status: 'Pending',
        });
        
        // destroy all advisers
        await Advisers.destroy({
            where: {
                orgId: org.id
            }
        });
        
        // convert advisers to array
        let advisers_array = advisers.split(',');
        
        // Create Adviser for Each Adviser
        for (let i = 0; i < advisers_array.length; i++){
            await Advisers.create({
                adviser_name: advisers_array[i],
                orgId: org.id
            });
        }

        if (!fs.existsSync(`org_applications/revalidation/${org.id}`)){
            fs.mkdirSync(`org_applications/revalidation/${org.id}`);
        }

        await Requirements.destroy({
            where: {
                orgId:org.id
            }
        })


        const files = req.files;
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.json('No files were uploaded.');
        }

        

        for (const fieldNames in files) {
            const file = files[fieldNames];
            fileUploadValidator.validate(file);
            const filePath = `org_applications/revalidation/${org.id}/${fieldNames}.pdf`;
            await file.mv(filePath);
            console.log(fieldNames)
            await Requirements.create({
                orgId: org.id,
                requirement_name: fieldNames,
                requirement: fieldNames + '.pdf',
            }, {
                logging: console.log, // Enable query logging for this specific query
            });
        }

        res.json({success: "Successfully applied for revalidation!"});
    }
    catch(err){
        res.json(err);
        console.log(err);
    }
})


router.post('/update_form/:org_id/:application_status', validateToken, async (req, res) => {
    const { org_id, application_status } = req.params;
    const file = req.files.file;
    const {requirement_name} = req.body;
    console.log(file)
    console.log(requirement_name)
    try{
        if(application_status === 'Accreditation'){
            fileUploadValidator.validate(file);
            const filePath = `org_applications/accreditation/${org_id}/${requirement_name}.pdf`;
            fs.writeFile(filePath, file.data, (err) => {if(err){console.log(err)}console.log(filePath)});
            res.json({message: 'Successfully updated form'})
        }else if(application_status === 'Revalidation'){
            console.log('Revalidation')
            fileUploadValidator.validate(file);
            const filePath = `org_applications/revalidation/${org_id}/${requirement_name}.pdf`;
            fs.writeFile(filePath, file.data, (err) => {if(err)console.log(err)});
            res.json({message: 'Successfully updated form'});
        }
        
    }catch(err){
        res.json(err);
        console.log(err);
    }
});


router.get('/show_accredited_orgs', async (req, res) => {
    try{

        // get the accredited orgs and the user details of the orgs use join
        Organization.findAll({
            include: [{
                model: Users,
                attributes: ['id', 'role', 'description', 'profile_picture'],
                required: true,
            }],
            where: {
                is_accredited: true,
            }
        }).then((orgs) => {
            let new_subjurisdiction = "";
            for (let i = 0; i < orgs.length; i++){
                if(orgs[i].subjurisdiction !== 'University-Wide'){
                    //Get only the last word in the string
                    new_subjurisdiction = orgs[i].subjurisdiction.split(" ");
                    new_subjurisdiction = new_subjurisdiction[new_subjurisdiction.length - 1];
                }
                else{
                    new_subjurisdiction = "U-Wide"
                }
                orgs[i].dataValues.subjurisdiction = new_subjurisdiction;
                new_subjurisdiction = "";
            }
            res.json(orgs);
        }
        ).catch((err) => {
            res.json(err);
            console.log(err);
        });

    }
    catch(err){
        res.json(err);
        console.log(err);
    }
});

router.get('/show_accredited_orgs/:search', async (req, res) => {
    try{
        const {search} = req.params;

        // get the accredited orgs and the user details of the orgs use join
        Organization.findAll({
            include: [{
                model: Users,
                attributes: ['id', 'role', 'description', 'profile_picture'],
                required: true,
            }],
            where: {
                is_accredited: true,
                org_name: {
                    [Op.like]: `%${search}%`
                }  
            }
        }).then((orgs) => {
            res.json(orgs);
        }
        ).catch((err) => {
            res.json(err);
            console.log(err);
        });

    }
    catch(err){
        res.json(err);
        console.log(err);
    }
});


module.exports = router;

