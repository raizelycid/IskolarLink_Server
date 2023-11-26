const express = require('express');
const router = express.Router();
const { Feedback } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');

// add feedback. fullName and email is optional
router.post('/add', async (req, res) => {
    const { fullName, email, subject, message } = req.body;
    try {
        const feedback = await Feedback.create({ fullName: fullName, email: email, subject:subject, message:message });
        res.json({success: "Feedback successfully sent!"});
    } catch (err) {
        res.json({error: "Error sending feedback."});
    }
});

router.get('/get', async (req, res) => {
    try {
        const feedback = await Feedback.findAll();
        res.json(feedback);
    } catch (err) {
        res.json({error: "Error fetching feedback."});
    }
});

// delete feedback
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const feedback = await Feedback.destroy({ where: { id } });
        res.json({success: "Feedback successfully deleted!"});
    } catch (err) {
        res.json({error: "Error deleting feedback."});
    }
});

module.exports = router;