const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');;
const checkPeriod = require('../middleware/App_Period');
const fs =require('fs');
const { ExpressFileuploadValidator} = require('express-fileupload-validator');
const upload = require('express-fileupload');
const {PDFDocument} = require('pdf-lib');
const {readFile,writeFile} = require('fs/promises');
const cookieParser = require('cookie-parser');
const cors = require('cors');
router.use(cookieParser());

router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app'],
        credentials: true
    }
));


router.put('/update_status/:id', [validateToken, checkPeriod], async (req, res) => {
    try{
        const {id} = req.params;
        const {status, feedback} = req.body;
        if(feedback){
            await Requirements.update({
                status: status,
                remarks: feedback,
            }, {
                where:{
                    id: id,
                }
            });
            res.json('Form returned with Feedback')
        }else{
        await Requirements.update({
            status: status,
        },{
            where:{
                id: id,
            }
        });
        console.log('done!!')
        res.json('Status updated successfully!')
    }
    }catch(err){
        res.json({error: err});
    }
});

module.exports = router;
