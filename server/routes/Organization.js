const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const cookieParser = require('cookie-parser');
const checkPeriod = require('../middleware/App_Period');
const fs =require('fs');
const { ExpressFileuploadValidator} = require('express-fileupload-validator');
const upload = require('express-fileupload');
const {PDFDocument} = require('pdf-lib');
const {readFile,writeFile} = require('fs/promises');

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

router.use(cookieParser());

router.post('/addorg', [validateToken, checkPeriod], async (req, res) => {
    const { orgName, jurisdiction, subjurisdiction, orgType, advisers} = req.body;
    const { id, student_id } = req.decoded;
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
        if (!fs.existsSync(`./org_applications/accreditation/${orgId}`)){
            fs.mkdirSync(`./org_applications/accreditation/${orgId}`);
        }

        const files = req.files;
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.json('No files were uploaded.');
        }
        for (const fieldNames in files) {
            const file = files[fieldNames];
            fileUploadValidator.validate(file);
            const filePath = `./org_applications/accreditation/${orgId}/${fieldNames}.pdf`;
            await file.mv(filePath);
            await Requirements.create({
                orgId: orgId,
                requirement_name: fieldNames,
                requirement: filePath,
            });
        }
        console.log({request_body: req.body, request_files: req.files, request_decoded: req.decoded, organization: organization, org_application: org_application, advisers: advisers_array});
        res.json({organization: organization});
        
    } catch (err) {
        res.json(err);
        console.log(err);
    }
});

router.post('/revalidation/:orgId', [validateToken, checkPeriod], async (req, res) => {
    const { orgId } = req.params;
    const { id, student_id } = req.decoded;
    const { org_name, jurisdiction, sub_jurisdiction, type, advisers} = req.body;
    try{
        const org = await Organization.findOne({
            where: {
                id: orgId
            }
        });
        if (org_name != org.org_name || jurisdiction != org.jurisdiction || sub_jurisdiction != org.sub_jurisdiction || type != org.type){
            await Organization.update({
                org_name: org_name,
                jurisdiction: jurisdiction,
                sub_jurisdiction: sub_jurisdiction,
                type: type,
                userId: id
            },{
                where: {
                    id: orgId
                }
            });
        }
        const org_application = await Org_Application.create({
            orgId: orgId,
            application_status: 'Pending',
        });
        
        // destroy all advisers
        await Advisers.destroy({
            where: {
                orgId: orgId
            }
        });
        
        // Create Adviser for Each Adviser
        for (let i = 0; i < advisers.length; i++){
            await Advisers.create({
                adviser_name: advisers[i],
                orgId: orgId
            });
        }

        if (!fs.existsSync(`./org_applications/revalidation/${orgId}`)){
            fs.mkdirSync(`./org_applications/revalidation/${orgId}`);
        }

        const pdfDoc = await PDFDocument.load(await readFile(`./templates/revalidation/RF001-TRACKER FORM.pdf`));

        const form = pdfDoc.getForm();
        const fieldNames = form.getFields();
        let adviser_names = '';
        for (let i = 0; i < advisers.length; i++){
            adviser_names += advisers[i];
            if (i != advisers.length - 1){
                adviser_names += ', ';
            }
        }

        form.getTextField(fieldNames[0].getName()).setText(org.socn);
        form.getTextField(fieldNames[1].getName()).setText(org_name);
        form.getTextField(fieldNames[2].getName()).setText(jurisdiction);
        form.getTextField(fieldNames[3].getName()).setText(sub_jurisdiction);
        form.getTextField(fieldNames[4].getName()).setText(type);
        form.getTextField(fieldNames[5].getName()).setText(adviser_names);
        form.getTextField(fieldNames[6].getName()).setText(org_name);

        const pdfBytes = await pdfDoc.save();
        await writeFile(`./org_applications/revalidation/${orgId}/RF001.pdf`,pdfBytes);

        await Requirements.create({
            orgId: orgId,
            requirement_name: 'RF001',
            requirement: `./org_applications/revalidation/${orgId}/RF001.pdf`,
        });

        const files = req.files;
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.json('No files were uploaded.');
        }

        for (const fieldNames in files) {
            const file = files[fieldNames];
            fileUploadValidator.validate(file);
            const filePath = `./org_applications/revalidation/${orgId}/${fieldNames}.pdf`;
            await file.mv(filePath);
            await Requirements.create({
                orgId: orgId,
                requirement_name: fieldNames,
                requirement: filePath,
            });
        }

        res.json("Successfully created organization");

    }
    catch(err){
        res.json(err);
        console.log(err);
    }
})


router.post('/update_form/:org_id/:application_status', [validateToken, checkPeriod], async (req, res) => {
    const { org_id, application_status } = req.params;
    const file = req.files.file;
    const {requirement_name} = req.body;
    console.log(file)
    console.log(requirement_name)
    try{
        if(application_status === 'Accreditation'){
            fileUploadValidator.validate(file);
            const filePath = `./org_applications/accreditation/${org_id}/${requirement_name}.pdf`;
            fs.writeFile(filePath, file.data, (err) => {if(err){console.log(err)}console.log(filePath)});
            res.json({message: 'Successfully updated form'})
        }else if(application_status === 'Revalidation'){
            console.log('Revalidation')
            fileUploadValidator.validate(file);
            const filePath = `./org_applications/revalidation/${org_id}/${requirement_name}.pdf`;
            fs.writeFile(filePath, file.data, (err) => {if(err)console.log(err)});
            res.json({message: 'Successfully updated form'});
        }
        
    }catch(err){
        res.json(err);
        console.log(err);
    }
});


module.exports = router;

