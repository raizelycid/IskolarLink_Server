const express = require('express');
const router = express.Router();
const {PDFDocument} = require('pdf-lib');
const {readFile,writeFile} = require('fs/promises');
const fs = require('fs');
const { Organization, Advisers } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const cors = require('cors');

router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app', 'https://iskolarlink.com'],
        credentials: true
    }
));


router.post('/generate_AF001', async (req, res ) => {
    try {
        const {orgId} = req.body;
        const pdfDoc = await PDFDocument.load(await readFile(`../templates/accreditation/AF001-TRACKER FORM.pdf`));
        const form = pdfDoc.getForm();
        const fieldNames = form.getFields();
        // Get the data from Organization table
        const org = await Organization.findOne({
            where: {
                id: orgId
            }
        });
        // Set the data to the PDF
        fieldNames.forEach((field)=>{
            console.log(field.getName());
        })
        // Combine Advisers separated by comma
        let adviser_names = '';
        const advisers = await Advisers.findAll({
            where: {
                orgId: orgId
            }
        });
        for (let i = 0; i < advisers.length; i++){
            adviser_names += advisers[i].adviser_name;
            if (i != advisers.length - 1){
                adviser_names += ', ';
            }
        }
        form.getTextField(fieldNames[0].getName()).setText(org.org_name);
        form.getTextField(fieldNames[1].getName()).setText(org.jurisdiction);
        form.getTextField(fieldNames[2].getName()).setText(org.sub_jurisdiction);
        form.getTextField(fieldNames[3].getName()).setText(org.type);
        form.getTextField(fieldNames[4].getName()).setText(adviser_names);
        form.getTextField(fieldNames[5].getName()).setText(org.org_name);
        
        const pdfBytes = await pdfDoc.save();
        await writeFile(`../org_applications/accreditation/${orgId}/AF001-TRACKER FORM.pdf`,pdfBytes);
        res.status(200).json({message: 'PDF created'});
    } catch (err) {
        console.log(err);
        res.status(500).json({message: 'Server Error'});
    }
});

router.post('/generate_AF001_temp', validateToken, async (req, res ) => {
    try {
        const {
            orgName,
            jurisdiction,
            subjurisdiction,
            orgType,
            advisers,
        } = req.body;
        const pdfDoc = await PDFDocument.load(await readFile(`templates/accreditation/AF001-TRACKER FORM.pdf`));
        const form = pdfDoc.getForm();
        const fieldNames = form.getFields();
        // Get the data from Organization table
        // Set the data to the PDF
        fieldNames.forEach((field)=>{
            console.log(field.getName());
        })
        form.getTextField(fieldNames[0].getName()).setText(orgName);
        form.getTextField(fieldNames[1].getName()).setText(jurisdiction);
        form.getTextField(fieldNames[2].getName()).setText(subjurisdiction);
        form.getTextField(fieldNames[3].getName()).setText(orgType);
        form.getTextField(fieldNames[4].getName()).setText(advisers);
        form.getTextField(fieldNames[5].getName()).setText(orgName);
        
        const pdfBytes = await pdfDoc.save();
        await writeFile(`temp/${req.decoded.username} - AF001 (Tracker Form).pdf`,pdfBytes);
        res.status(200).json({message: 'PDF created', filename: `${req.decoded.username} - AF001 (Tracker Form).pdf`});
    } catch (err) {
        console.log(err);
        res.status(500).json({message: 'Server Error'});
    }
});

router.post('/generate_AD009_temp', validateToken, async (req, res ) => {
    try {
        const {
            orgName,
            jurisdiction,
            subjurisdiction,
            orgType,
            advisers,
        } = req.body;
        const pdfDoc = await PDFDocument.load(await readFile(`templates/accreditation/AD009-WAIVER OF RESPONSIBILITY.pdf`));
        const form = pdfDoc.getForm();
        const fieldNames = form.getFields();
        // Get the data from Organization table
        // Set the data to the PDF
        fieldNames.forEach((field)=>{
            console.log(field.getName());
        })
        form.getTextField(fieldNames[0].getName()).setText(orgName);
        form.getTextField(fieldNames[1].getName()).setText(jurisdiction);
        form.getTextField(fieldNames[2].getName()).setText(subjurisdiction);
        form.getTextField(fieldNames[3].getName()).setText(orgType);
        form.getTextField(fieldNames[4].getName()).setText(advisers);
        
        const pdfBytes = await pdfDoc.save();
        await writeFile(`temp/${req.decoded.username} - AD009 (Waiver Form).pdf`,pdfBytes);
        res.status(200).json({message: 'PDF created', filename: `${req.decoded.username} - AD009 (Waiver Form).pdf`});
    }
    catch (err) {
        console.log(err);
        res.status(500).json({message: 'Server Error'});
    }
});

// generate RF001 temp
router.post('/generate_RF001_temp', validateToken, async (req,res) => {
    try {
        const {
            socn,
            orgName,
            jurisdiction,
            subjurisdiction,
            orgType,
            advisers,
        } = req.body;

        const pdfDoc = await PDFDocument.load(await readFile(`templates/revalidation/RF001-TRACKER FORM.pdf`));
        const form = pdfDoc.getForm();
        const fieldNames = form.getFields();

        form.getTextField(fieldNames[0].getName()).setText(socn);
        form.getTextField(fieldNames[1].getName()).setText(orgName);
        form.getTextField(fieldNames[2].getName()).setText(jurisdiction);
        form.getTextField(fieldNames[3].getName()).setText(subjurisdiction);
        form.getTextField(fieldNames[4].getName()).setText(orgType);
        form.getTextField(fieldNames[5].getName()).setText(advisers);
        form.getTextField(fieldNames[6].getName()).setText(orgName)
        
        const pdfBytes = await pdfDoc.save();
        await writeFile(`temp/${req.decoded.username} - RF001 (Tracker Form).pdf`,pdfBytes);
        res.status(200).json({message: 'PDF created', filename: `${req.decoded.username} - RF001 (Tracker Form).pdf`});
    }catch(err){
        res.json(err)
    }
   
});

router.post('/generate_RD011_temp', validateToken, async (req,res) => {
    try {
        const {
            socn,
            orgName,
            jurisdiction,
            subjurisdiction,
            orgType,
            advisers,
        } = req.body;

        const pdfDoc = await PDFDocument.load(await readFile(`templates/revalidation/RD011-WAIVER OF RESPONSIBILITY.pdf`));
        const form = pdfDoc.getForm();
        const fieldNames = form.getFields();

        form.getTextField(fieldNames[0].getName()).setText(socn);
        form.getTextField(fieldNames[1].getName()).setText(orgName);
        form.getTextField(fieldNames[2].getName()).setText(jurisdiction);
        form.getTextField(fieldNames[3].getName()).setText(subjurisdiction);
        form.getTextField(fieldNames[4].getName()).setText(orgType);
        form.getTextField(fieldNames[5].getName()).setText(advisers);
        
        const pdfBytes = await pdfDoc.save();
        await writeFile(`temp/${req.decoded.username} - RD011 - WAIVER OF RESPONSIBILITY.pdf`,pdfBytes);
        res.status(200).json({message: 'PDF created', filename: `${req.decoded.username} - RD011 - WAIVER OF RESPONSIBILITY.pdf`});
    }catch(err){
        res.json(err)
    }
   
});

module.exports = router;

