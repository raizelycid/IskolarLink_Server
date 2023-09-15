const express = require('express');
const router = express.Router();
const {PDFDocument} = require('pdf-lib');
const {readFile,writeFile} = require('fs/promises');
const fs = require('fs');
const { Organization, Advisers } = require('../models');


router.post('/accreditation', async (req, res ) => {
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

// Get the input and Id of the org
/*
async function createPDF(input,output){
    try{
        // Check if directory exists and create if not
        if (!fs.existsSync(`../org_applications/accreditation/${orgId}`)){
            fs.mkdirSync(`../org_applications/accreditation/${orgId}`);
        }
        const pdfDoc = await PDFDocument.load(await readFile(input));
        let fieldNames = pdfDoc.getForm().getFields();
        fieldNames.forEach((field)=>{
            console.log(field.getName());
        })


        const form = pdfDoc.getForm();
        form.getTextField(fieldNames[0].getName()).setText('Hello World');
        form.getTextField(fieldNames[1].getName()).setText('Hello World 2');
        form.getTextField(fieldNames[2].getName()).setText('Hello World 3');
        form.getTextField(fieldNames[3].getName()).setText('Hello World 4');
        form.getTextField(fieldNames[4].getName()).setText('Hello World 5');
        form.getTextField(fieldNames[5].getName()).setText('Hello World 6');

        const pdfBytes = await pdfDoc.save();

        await writeFile(output,pdfBytes);

    }catch(err){
        console.log(err);
    }
}

createPDF(`../templates/accreditation/AF001-TRACKER FORM.pdf`,`../org_applications/accreditation/${orgId}/AF001-TRACKER FORM.pdf`)*/

module.exports = router;

