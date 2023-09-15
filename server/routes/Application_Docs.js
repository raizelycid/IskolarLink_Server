const express = require('express');
const router = express.Router();
const {PDFDocument} = require('pdf-lib');
const {readFile, writeFile} = require('fs').promises;

async function createPDF(input,output){
    try{
        const pdfDoc = await PDFDocument.load(await readFile(input));
        let fieldNames = pdfDoc.getForm().getFields();
        fieldNames.forEach((field)=>{
            console.log(field.getName());
        })
    }catch(err){
        console.log(err);
    }
}

createPDF('../templates/accreditation/AF001-TRACKER FORM.pdf','../org_applications/accreditation/AF001-TRACKER FORM.pdf')

