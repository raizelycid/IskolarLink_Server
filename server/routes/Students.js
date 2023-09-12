const express = require('express');
const router = express.Router();
const { Students } = require('../models');


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

module.exports = router;