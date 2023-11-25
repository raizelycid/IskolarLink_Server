const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users, Membership, Students, Socials, Org_Announcement, COSOA_Members } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');



//count all students
router.get('/count_students', async (req, res) => {
    try{
        const students = await Students.count();
        res.json(students);
    }catch(err){
        res.json(err);
    }
});

//count all students where cor is not null and is_verified is not true
router.get('/count_students_to_verify', async (req, res) => {
    try{
        const students = await Students.count({
            where: {cor: {[Op.ne]: null}, is_verified: false}
        });
        res.json(students);
    }catch(err){
        res.json(err);
    }
});


// From COSOA_Members, get studentId where position is Chairperson and get information in Users and Students table
router.get('/get_chairperson', async (req, res) => {
    try{
        const chairperson = await COSOA_Members.findOne({
            attributes: ['studentId'],
            where: {position: 'Chairperson'}
        });
        const student = await Students.findOne({
            attributes: ['student_Fname','student_Lname','userId'],
            where: {userId: chairperson.studentId}
        });
        const user = await Users.findOne({
            attributes: ['email','profile_picture'],
            where: {id: student.userId}
        });
        
        res.json({user: user, student: student});
    }catch(err){
        res.json(err);
    }
});

// get students with cor but not verified
router.get('/get_students_to_verify', async (req, res) => {
    try{
        const students = await Students.findAll({
            attributes: ['userId', 'id', 'student_Fname', 'student_Lname', 'cor', 'cor_remarks', 'is_verified'],
            where: {cor: {[Op.ne]: null}, is_verified: false}
        });

        //get their email from Users table
        const studentIds = await Users.findAll({
            attributes: ['email'],
            where: {id: students.map(student => student.userId)}
        });

        // merge the studentIds from their respective students
        const studentsWithIds = students.map((student, index) => {
            return {...student.dataValues, email: studentIds[index].email};
        });

        res.json(studentsWithIds);
        
    }catch(err){
        res.json(err);
    }
});


// update student's is_verified to true and delete their cor
router.post('/verify_student', async (req, res) => {
    try{
        const student = await Students.update({is_verified: true, cor: null}, {
            where: {id: req.body.studentId}
        });

        fs.unlink(`./cor/${req.body.cor}`, (err) => {
            if(err){
                console.log(err);
            }
        });

        res.json({success: "Student verified!"});
    }catch(err){
        res.json(err);
    }
});

// give feedback to student
router.post('/give_feedback', async (req, res) => {
    try{
        console.log(req.body)
        
        const student = await Students.update({cor_remarks: req.body.feedback, cor:null}, {
            where: {id: req.body.studentId}
        });

        //detete cor
        fs.unlink(`./cor/${req.body.cor}`, (err) => {
            if(err){
                console.log(err);
            }
        });

        res.json({success: "Feedback given!"});
    }catch(err){
        res.json(err);
    }
});

module.exports = router;