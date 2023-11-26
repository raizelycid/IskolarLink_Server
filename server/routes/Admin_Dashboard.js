const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users, Membership, Students, Socials, Org_Announcement, COSOA_Members } = require('../models');
const { Op, where } = require('sequelize');
const fs = require('fs');
const validateToken = require('../middleware/AuthMiddleware');



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
        console.log("PASS 1")
        const student = await Students.findOne({
            attributes: ['student_Fname','student_Lname','userId'],
            where: {id: chairperson.studentId}
        });
        console.log("PASS 2")
        const user = await Users.findOne({
            attributes: ['email','profile_picture'],
            where: {id: student.userId}
        });
        console.log("PASS 3")
        
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


// delete cor, student data, and user data
router.post('/delete_student', async (req, res) => {
    try{
        //delete cor
        fs.unlink(`./cor/${req.body.cor}`, (err) => {
            if(err){
                console.log(err);
            }
        });

        //delete student data
        const student = await Students.destroy({
            where: {id: req.body.studentId}
        });

        //delete user data
        const user = await Users.destroy({
            where: {id: req.body.userId}
        });

        res.json({success: "Student deleted!"});
    }catch(err){
        res.json(err);
    }
});

//Change Chairperson
router.post('/update_chairperson', validateToken, async (req,res) => {
    const {id} = req.decoded
    const {student_num, email} = req.body

    const student = await Students.findOne({
        where: {userId:id}
    });


    if(!student.is_web_admin){
        return res.json({error:"You are not an admin! WE HAVE NOTIFIED THE ADMIN ABOUT THIS INCIDENT. GET OUT!"})
    }
    console.log("PASS 1")

    const confirmNumber = await Users.findOne({
        where:{email:{[Op.like]: `%${email}%`}}
    })

    if(!confirmNumber){
        return res.json({error: "The student number you submitted does not exist. Try Again."})
    }
    console.log("PASS 2")


    const newChairman = await Students.findOne({
        where:{student_num: student_num}
    })

    if(!newChairman.is_verified){
        return res.json({error: "The Student you are trying to give chairperson rights is not verified."})
    }

    if(confirmNumber.id !== newChairman.userId){
        return res.json({error: "The Student Number and Webmail you provided does not match."})
    }
    console.log("PASS 3")

    const formerChairperson = await COSOA_Members.findOne({
        where: {position: "Chairperson"}
    })
    console.log("PASS 4")

    const formerMember = await COSOA_Members.findOne({
        where: {studentId: newChairman.id}
    })


    if(formerMember){
        formerMember.destroy()
    }

    console.log("PASS 5")

    await COSOA_Members.update(
        {studentId:newChairman.id},
        {where: {id: formerChairperson.id}}
    )

    await Students.update({
        is_cosoa: false
    }, {where:{id:formerChairperson.studentId}})

    newChairman.is_cosoa = true;
    await newChairman.save()



    console.log("PASS 6")

    res.status(200).json({success: `Successfully transfered rights to ${newChairman.student_Fname} ${newChairman.student_Lname}`})

});



module.exports = router;