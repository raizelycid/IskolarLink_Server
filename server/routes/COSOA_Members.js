const express = require('express');
const router = express.Router();
const { Organization, Users, Students, COSOA_Members, Org_Application, Requirements, Advisers, Sequelize } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const {Op} = require('sequelize');
const cors = require('cors');

router.use(cors(
  {
      origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app', 'http://iskolarlink.com'],
      credentials: true
  }
));


// Route to create a COSOA member
router.post("/create_cosoa_member", validateToken, async (req, res) => {
  try {
    console.log("starting process");
    // Get email from req.body
    const { email, position } = req.body;

    // Get id and role from req.decoded
    const { student_id, role } = req.decoded;

    console.log("PASS 1");

    if (role !== "student" || !student_id) {
      return res
        .status(400)
        .json({ error: "You are not authorized to create a COSOA member." });
    } else {
      // Check if the student's position is one of the allowed positions
      const allowedPositions = [
        "Chairperson",
        "Chairperson (Asst.)",
        "Vice Chairperson",
        "Vice Chairperson (Asst.)",
      ];

      // Find the student's position from the COSOA_Members table based on their ID
      const cosoaMember = await COSOA_Members.findOne({
        where: { studentId: student_id },
      });
      console.log(student_id);

      console.log(cosoaMember);

      console.log("PASS 2");

      if (!cosoaMember || !allowedPositions.includes(cosoaMember.position)) {
        return res
          .status(400)
          .json({ error: "You are not authorized to create a COSOA member." });
      } else {
        console.log("PASS 3");

        // Find the student using the provided email
        const user = await Users.findOne({
          where: {
            email: {
              [Op.like]: email,
            },
          },
        });

        console.log("PASS 4");

        if (!user) {
          return res
            .status(400)
            .json({ error: "User not found with the provided email." });
        } else {
          console.log("PASS 5");

          // Check if the user's is_verified is true
          const student = await Students.findOne({
            where: { userId: user.id },
          });

          console.log("PASS 6");

          if (!student || !student.is_verified) {
            return res
              .status(400)
              .json({ error: "User is not verified or is not a student." });
          } else {
            console.log("PASS 7");

            // Check if a COSOA member with the same studentId exists
            const existingCOSOAMember = await COSOA_Members.findOne({
              where: { studentId: student.id },
            });

            console.log("PASS 8");

            if (existingCOSOAMember) {
              return res
                .status(400)
                .json({
                  error: "A COSOA member already exists for this student.",
                });
            } else {
              console.log("PASS 9");

              // Create a COSOA member with the student's id and position
              await COSOA_Members.create({
                position: position,
                studentId: student.id,
              });

              console.log("PASS 10");

              student.is_cosoa = true;

              await student.save();

              console.log("PASS 11");

              return res
                .status(201)
                .json({ success: "COSOA member created successfully." });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


  // Route to get all COSOA members with names and profile pictures
  router.get('/get_members', validateToken, async (req, res) => {
    try {
      // Define the order of positions
      const positionsOrder = [
        'Chairperson',
        'Chairperson (Asst.)',
        'Vice Chairperson',
        'Vice Chairperson (Asst.)',
        'Secretary-General',
        'Executive Director',
        'External Affairs',
        'Internal Affairs',
        'Document Management',
        'Internal Performance Evaluator',
        'Legal Affairs',
        'Social Media Management',
        'Application Evaluator'
      ];
  
      // Get all COSOA members from the COSOA_Members table
      const cosoaMembers = await COSOA_Members.findAll();
  
      // Initialize an array to store the results
      const result = [];
  
      // Iterate through the COSOA members and retrieve additional information
      for (const cosoaMember of cosoaMembers) {
        const student = await Students.findOne({
          where: { id: cosoaMember.studentId }
        });
  
        if (student) {
          const user = await Users.findOne({
            where: { id: student.userId }
          });
  
          if (user) {
            // Extract the relevant information
            const memberInfo = {
              id: cosoaMember.id, // COSOA member id
              student_id: student.id, // Student id
              name: `${student.student_Fname} ${student.student_Lname}`,
              position: cosoaMember.position,
              profile_picture: user.profile_picture
            };
  
            // Add the member's information to the result array
            result.push(memberInfo);
          }
        }
      }
  
      // Sort the result array by position
      result.sort((a, b) => {
        const indexA = positionsOrder.indexOf(a.position);
        const indexB = positionsOrder.indexOf(b.position);
        return indexA - indexB;
      });
  
      // Return the sorted result as JSON
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


router.put('/update_cosoa_member/:memberId', validateToken, async (req, res) => {
    try {
      const { position } = req.body;
      const memberId = req.params.memberId;

  
      // Update the position of the COSOA member with memberId
      await COSOA_Members.update(
        { position: position },
        { where: { id: memberId } }
      );
  
      res.status(200).json({ success: 'Position updated successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Define an API endpoint for removing a member
router.delete('/remove_cosoa_member/:memberId', validateToken, async (req, res) => {
    try {
      const memberId = req.params.memberId;
  
      // Remove the COSOA member with memberId
      await COSOA_Members.destroy({ where: { id: memberId } });
  
      res.status(200).json({ success: 'Member removed successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


  router.get('/get_user_position', validateToken, async (req, res) => {
    try {
      const userId = req.decoded.id;
  
      // Assuming the user's position is stored in the "position" field of the Users table
      const student = await Students.findOne({
        where:{userId:userId}
      })
  
      if (!student) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const cosoaMember = await COSOA_Members.findOne({
        where: {studentId:student.id}
      })
  
      const userPosition = cosoaMember.position;
  
      res.status(200).json({ position: userPosition });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


router.get('/search_student/:email', async (req, res) =>{
  const {email} = req.params

  const results = await Users.findAll({
    include: [{
      model: Students,
      as: 'student',
      attributes:['student_Fname','student_Lname','id']
    }],
    attributes:['id','profile_picture','email'],
    where:{
      email:{
        [Op.like]: `%${email}%`
      },
      role: 'student'
    }
  })

  res.json(results)

});
  

module.exports = router;