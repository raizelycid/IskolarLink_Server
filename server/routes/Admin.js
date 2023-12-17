const express = require('express');
const router = express.Router();
const { Students, COSOA_Members } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const cors = require('cors');

router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app', 'http://iskolarlink.com'],
        credentials: true
    }
));

// Set is_verified to true
router.put('/verify/:studentId', validateToken, async (req, res) => {
    const studentId = req.params.studentId;
    console.log(req.decoded)
    if (req.decoded.is_web_admin === false){
        res.json(`You are not authorized to verify students!`);
    }else{
        try{
            await Students.update({ is_verified: true }, {
                where: {
                    id: studentId
                }
            });
            res.json(`Student with id ${studentId} is now verified!`);
        }catch(err){
            res.json(err);
        }
    }
});

// Add COSOA chairperson
router.post('/cosoa/:studentId', validateToken, async (req, res) => {
    const studentId = req.params.studentId;
    if (req.decoded.is_web_admin === false){
        res.json(`You are not authorized to add COSOA members!`);
    }else{
        try{
            const cosoa_member = await COSOA_Members.create({
                position: 'Chairperson',
                studentId: studentId
            });
            res.json(`COSOA Chairperson added!`);
        }catch(err){
            res.json(err);
        }
    }
});





module.exports = router;

