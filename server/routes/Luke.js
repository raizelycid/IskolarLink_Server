const express = require('express');
const router = express.Router();
const { Users, Students, Organization } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

router.post('/register', async (req, res) => {
    const students = req.body; // Expecting an array of students

    try {
        // Map each student to a promise of creating user and student records
        const creationPromises = students.map(async (studentData) => {
            const { email, password, student_num, student_Lname, student_Fname, student_Mname, student_suffix, department, year_level } = studentData;

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await Users.create({
                email: email,
                password: hashedPassword,
                role: 'student',
            });

            return Students.create({
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
                userId: user.id
            });
        });

        // Wait for all the student records to be created
        await Promise.all(creationPromises);

        res.json(`Students created successfully!`);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            res.json(`A student number already exists in the submitted data!`);
        } else {
            res.json(err.message);
        }
    }
});

module.exports = router;
