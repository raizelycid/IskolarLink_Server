
const express = require('express');
const router = express.Router();
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { Users } = require('../models');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    }
});



router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app'],
        credentials: true
    }
));

router.post('/send_test_email', async (req, res) => {
    const {email} = req.body;
    const mailOptions = {
        from: process.env.NODEMAILER_USER,
        to: email,
        subject: 'Test Email',
        text: 'This is a test email'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if(error){
            console.log(error);
            res.json({error: `mailing error: ${error}`});
        }else{
            console.log('Email sent: ' + info.response);
            res.json({success: 'Email sent'});
        }
    });

});

router.post("/test", async (req, res) => {
    res.json({success: "test"});
});


router.post('/send_forgot_password', async (req, res) => {
    const {email} = req.body;
    //check if email exists in database
    const user = await Users.findOne({
        where: {email: email}
    });

    if(!user){
        res.json({error: 'Email does not exist'});
        return;
    }

});





module.exports = router;
