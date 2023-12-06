const express = require('express');
const router = express.Router();
const { COSOA_ANN, COSOA_Events } = require('../models');
const multer = require('multer');
const upload = require('express-fileupload');
const fs = require('fs');
const e = require('express');
const cors = require('cors');

router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app'],
        credentials: true
    }
));

router.use(upload());


router.post('/', async (req, res) => {
    const { cosoa_ann_title, cosoa_ann_link, cosoa_ann_body } = req.body;
    const { cosoa_ann_photo } = req.files;
    try {
        const cosoa_ann = await COSOA_ANN.create({
            cosoa_ann_photo: cosoa_ann_photo.name,
            cosoa_ann_title: cosoa_ann_title,
            cosoa_ann_link: cosoa_ann_link,
            cosoa_ann_body: cosoa_ann_body
        });

        const fullPath = `public/cosoa_announcements/${cosoa_ann_photo.name}`;
        cosoa_ann_photo.mv(fullPath);

        res.json("Successfully posted an announcement!");
    } catch (err) {
        res.json(err);
    }
});

router.get('/', async (req, res) => {
    // Get all 3 latest announcements
    try {
        const cosoa_ann = await COSOA_ANN.findAll({
            order: [['createdAt', 'DESC']],
            limit: 3
        });
        res.json(cosoa_ann);
    } catch (err) {
        res.json(err);
    }
});

router.post('/add_event', async (req, res) => {
    const {title, date, description, link} = req.body;
    try {
        const cosoa_event = await COSOA_Events.create({
            title: title,
            date: date,
            description: description,
            link: link
        });
        res.json(cosoa_event);
    } catch (err) {
        res.json(err);
    }
});


//function to get all events
router.get('/get_events', async (req, res) => {
    try {
        const cosoa_events = await COSOA_Events.findAll();
        if(cosoa_events.length === 0) {
            res.json({err: "No events found"});
        }else{
            res.json(cosoa_events);
        }
    } catch (err) {
        res.json(err);
    }
});

module.exports = router;