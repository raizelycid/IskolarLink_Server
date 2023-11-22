const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users, Students } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const cookieParser = require('cookie-parser');
const checkPeriod = require('../middleware/App_Period');
const fs =require('fs');
const { ExpressFileuploadValidator} = require('express-fileupload-validator');
const upload = require('express-fileupload');
const {PDFDocument} = require('pdf-lib');
const {readFile,writeFile} = require('fs/promises');

router.get('/', validateToken, async (req, res) => {
    const { id, student_id } = req.decoded;
    try {
        const student = await Students.findOne({
            where: { userId: id }   
        });

        // get only the email attribute from the user table
        const email = await Users.findOne({
            attributes: ['email', 'description','profile_picture'],
            where: { id: id }
        });

        student.dataValues.email = email.dataValues.email;
        student.dataValues.description = email.dataValues.description;
        student.dataValues.profile_picture = email.dataValues.profile_picture;

        res.json(student);

    } catch (err) {
        res.json(err);
    }
});






module.exports = router;