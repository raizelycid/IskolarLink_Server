const express = require('express');
const router = express.Router();
const { Organization, Requirements, Advisers, Sequelize } = require('../models');
const cors = require('cors');
const fs = require('fs-extra');
const arhiver = require('archiver');
const path = require('path');
const { Op } = require("sequelize");
const PDFDocument = require('pdf-lib');


router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app'],
        credentials: true
    }
));

// Archive all organizations
router.get('/archive_orgs', async (req, res) => {
    try{

        // create folder archive if it does not exist folder name is based on school year (ex. 2324-Archive)
        const date = new Date();
        const year = date.getFullYear();
        const year1 = year.toString().slice(2,4);
        const year2 = year1 + 1;
        const school_year = `${year1}${year2}`;
        fs.mkdirSync(`./public/archive/${school_year}-Archive`, { recursive: true });

        // Get all organizations and order them by application_status starting from Accreditation, Revalidation, Accredited, Revalidated, Rejected
        const orgs = await Organization.findAll({
            order: Sequelize.literal('CASE WHEN application_status = "Accreditation" THEN 1 WHEN application_status = "Revalidation" THEN 2 WHEN application_status = "Accredited" THEN 3 WHEN application_status = "Revalidated" THEN 4 WHEN application_status = "Rejected" THEN 5 END')
        });
        // Create a folder for every organization based on id. Get every requirement of each organization and merge them to one pdf file
        for (let i = 0; i < orgs.length; i++){
            // Create a folder for the organization
            fs.mkdirSync(`./public/archive/${school_year}-Archive/${orgs[i].id}`, { recursive: true });

            // Get all the requirements of the organization
            const requirements = await Requirements.findAll({
                where: {
                    orgId: orgs[i].id
                }
            });

            if(orgs[i].application_status === "Accreditation" || orgs[i].application_status === "Accredited"){
                // use pdfDoc to read "requirement" pdf files and merge them to one pdf file
                const pdfDoc = await PDFDocument.PDFDocument.create();
                for (let j = 0; j < requirements.length; j++){
                    // Read the requirement pdf file. Continue even if the file does not exist
                    try{
                        const requirement = await PDFDocument.PDFDocument.load(fs.readFileSync(`./org_applications/accreditation/${orgs[i].id}/${requirements[j].requirement}`));
                        const copiedPages = await pdfDoc.copyPages(requirement, requirement.getPageIndices());
                        copiedPages.forEach((page) => pdfDoc.addPage(page));
                    }catch(err){
                        continue;
                    }

                    }
                }else if(orgs[i].application_status === "Revalidation" || orgs[i].application_status === "Revalidated"){
                    // use pdfDoc to read "requirement" pdf files and merge them to one pdf file
                    const pdfDoc = await PDFDocument.PDFDocument.create();
                    for (let j = 0; j < requirements.length; j++){
                        // Read the requirement pdf file. Continue even if the file does not exist
                        try{
                            const requirement = await PDFDocument.PDFDocument.load(fs.readFileSync(`./org_applications/revalidation/${orgs[i].id}/${requirements[j].requirement}`));
                            const copiedPages = await pdfDoc.copyPages(requirement, requirement.getPageIndices());
                            copiedPages.forEach((page) => pdfDoc.addPage(page));
                        }catch(err){
                            continue;
                        }
                    }
                }else if(orgs[i].application_status === "Rejected"){
                    //Find if id is in accreditation or revalidation folder
                    let folder = "";
                    if(fs.existsSync(`./org_applications/accreditation/${orgs[i].id}`)){
                        folder = "accreditation";
                    }else{
                        folder = "revalidation";
                    }

                    // use pdfDoc to read "requirement" pdf files and merge them to one pdf file
                    const pdfDoc = await PDFDocument.PDFDocument.create();
                    for (let j = 0; j < requirements.length; j++){
                        // Read the requirement pdf file. Continue even if the file does not exist
                        try{
                            const requirement = await PDFDocument.PDFDocument.load(fs.readFileSync(`./org_applications/${folder}/${orgs[i].id}/${requirements[j].requirement}`));
                            const copiedPages = await pdfDoc.copyPages(requirement, requirement.getPageIndices());
                            copiedPages.forEach((page) => pdfDoc.addPage(page));
                        }catch(err){
                            continue;
                        }
                    }
                }

                // Write the merged pdf file to the folder of the organization
                const pdfBytes = await pdfDoc.save();
                fs.writeFileSync(`./public/archive/${school_year}-Archive/${orgs[i].id}/${orgs[i].org_name}.pdf`, pdfBytes);
            }

        // Zip the archive folder
        const output = fs.createWriteStream(`./public/archive/${school_year}-Archive.zip`);
            // winzip
            const archive = arhiver('zip', {
                zlib: { level: 9 }
            });
            output.on('close', function() {
                console.log(archive.pointer() + ' total bytes');
                console.log('archiver has been finalized and the output file descriptor has closed.');
            });
    }catch(err){
        console.log(err);
    }
});

module.exports = router;