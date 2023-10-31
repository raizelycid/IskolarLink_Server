const express = require('express');
const router = express.Router();
const { Students } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const upload = require('express-fileupload');
const { ExpressFileuploadValidator} = require('express-fileupload-validator');

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

router.use(upload());


// Create a student and pass userId as a foreign key
router.post('/', async (req, res) => {
    const {
        student_num,
        student_Lname,
        student_Fname,
        student_Mname,
        student_suffix,
        department,
        year_level,
        userId
    } = req.body;
    try {
        const student = await Students.create({
            student_num: student_num,
            student_Lname: student_Lname,
            student_Fname: student_Fname,
            student_Mname: student_Mname,
            student_suffix: student_suffix,
            department: department,
            year_level: year_level,
            is_verified: false,
            is_cosoa: false,
            is_web_admin: false,
            userId: userId
        });
        res.json(student);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            res.json(`Student number already exists!`);
        }else{
            res.json(err);
        }
    }
});

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

module.exports = router;