const express = require('express');
const router = express.Router();
const { Organization, Org_Application, Advisers, Requirements, Users, Membership, Students, Socials, Org_Announcement, COSOA_Members } = require('../models');
const { Op, where } = require('sequelize');
const fs = require('fs');
const validateToken = require('../middleware/AuthMiddleware');
const path = require('path');
const fsp = require('fs/promises')
const cors = require('cors');

router.use(cors(
  {
      origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app', 'https://iskolarlink.com'],
      credentials: true
  }
));



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

router.get('/get_web_admin', async (req,res)=> {
    try{
        const admin = await Students.findOne({
            attributes: ['student_Fname','student_Lname','userId'],
            where:{is_web_admin:true}
        })

        const user = await Users.findOne({
            attributes: ['email','profile_picture'],
            where: {id: admin.userId}
        });

        res.json({admin: admin, user:user})
    
    }catch(err){
        res.json(err)
    }
})

// get students with cor but not verified
router.get('/get_students', async (req, res) => {
  try {
    const students = await Students.findAll({
      attributes: ['id', 'student_Fname', 'student_Lname', 'cor', 'cor_remarks', 'is_verified', 'createdAt'],
      include: [
        {
          model: Users,
          attributes: ['email'],
          as:'user'
        },
      ],
    });

    // Process the students and their associated email addresses
    const studentsWithIds = students.map(student => {
      const createdAt = new Date(student.createdAt);
      const currentDate = new Date();
      const daysDifference = Math.floor((currentDate - createdAt) / (1000 * 60 * 60 * 24));
      return {
        ...student.dataValues,
        days: daysDifference
      };
    });

    res.json(studentsWithIds);
  } catch (err) {
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
router.post("/update_chairperson", validateToken, async (req, res) => {
  const { id } = req.decoded;
  const { student_num, email } = req.body;


  console.log("attempting to update chairperson");

  const student = await Students.findOne({
    where: { userId: id },
  });

  if (!student.is_web_admin) {
    return res.json({
      error:
        "You are not an admin! WE HAVE NOTIFIED THE ADMIN ABOUT THIS INCIDENT. GET OUT!",
    });
  } else {
    const chairperson = await COSOA_Members.findOne({
      where: { position: "Chairperson" },
    });
    if (!chairperson) {
      return res.json({
        error: "Chairman has been deleted. notify your Database admin immediately",
      });
    } else {
      const newChairpersonUser = await Users.findOne({
        where: { email: email },
      });
      if (!newChairpersonUser) {
        return res.json({ error: "The email you provided does not exist." });
      } else {
        const newChairpersonStudent = await Students.findOne({
          where: { student_num: student_num },
        });
        if (!newChairpersonStudent) {
          return res.json({
            error: "The Student Number you provided does not exist",
          });
        } else {
          const valid1 = newChairpersonStudent.is_verified === true;
          if (!valid1) {
            return res.json({ error: "The Student is not verified yet" });
          } else {
            const valid2 =
              newChairpersonUser.id === newChairpersonStudent.userId;
            if (!valid2) {
              return res.json({
                error:
                  "The Student Number and Webmail you provided doesn't match.",
              });
            } else {
              const member = await COSOA_Members.findOne({
                where: { studentId: newChairpersonStudent.id },
              });
              if (member) {
                await member.destroy();
              } else {
                chairperson.studentId = newChairpersonStudent.id;
                await chairperson.save();
                student.is_cosoa = false;
                await student.save();
                newChairpersonStudent.is_cosoa = true;
                await newChairpersonStudent.save()
                return res.json({success:`Successfully updated the chairman to ${newChairpersonStudent.student_Fname} ${newChairpersonStudent.student_Lname} ${newChairpersonStudent.student_suffix}`})
              }
            }
          }
        }
      }
    }
  }
});



router.post("/update_web_admin", validateToken, async (req, res) => {
    const { id } = req.decoded;
    const { student_num, email } = req.body;
  
  
    console.log("attempting to update web admin");
  
    const student = await Students.findOne({
      where: { userId: id },
    });
  
    if (!student.is_web_admin) {
      return res.json({
        error:
          "You are not an admin! WE HAVE NOTIFIED THE ADMIN ABOUT THIS INCIDENT. GET OUT!",
      });
    } else {
        const newWebAdminUser = await Users.findOne({
          where: { email: email },
        });
        if (!newWebAdminUser) {
          return res.json({ error: "The email you provided does not exist." });
        } else {
          const newWebAdminStudent = await Students.findOne({
            where: { student_num: student_num },
          });
          if (!newWebAdminStudent) {
            return res.json({
              error: "The Student Number you provided does not exist",
            });
          } else {
            const valid1 = newWebAdminStudent.is_verified === true;
            if (!valid1) {
              return res.json({ error: "The Student is not verified yet" });
            } else {
              const valid2 =
                newWebAdminUser.id === newWebAdminStudent.userId;
              if (!valid2) {
                return res.json({
                  error:
                    "The Student Number and Webmail you provided doesn't match.",
                });
              } else {
                  student.is_web_admin = false;
                  await student.save();
                  newWebAdminStudent.is_web_admin = true;
                  await newWebAdminStudent.save();
                  return res.json({success:`Successfully updated the Website Admin to ${newWebAdminStudent.student_Fname} ${newWebAdminStudent.student_Lname} ${newWebAdminStudent.student_suffix}`})
                }
              }
            }
      }
    }
  });


router.post('/start_semester',validateToken, async (req, res)=>{
  try{

    let dirpath = './cor'
    const cor_files = await fsp.readdir(dirpath)

      
    const deleteFilePromises = cor_files.map(file =>
      fsp.unlink(path.join(dirpath, file)),
    );

    await Promise.all(deleteFilePromises);


    const students = await Students.findAll();
    
    // Loop through the students and update each one
    for (const student of students) {
      if(student.userId !== req.decoded.id){
      await student.update({ is_verified: false });
      }
    }

    res.json({success:"You have successfully started the semester!"})
  }catch(err){
    res.json(err)
  }
})



module.exports = router;