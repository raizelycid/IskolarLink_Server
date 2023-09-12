const express = require('express');
const router = express.Router();
const { COSOA_ANN } = require('../models');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        return cb(null, './cosoa_announcements');
    },
    filename: (req, file, cb) =>{
        return cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('cosoa_ann_photo'), async (req, res) => {
    const { cosoa_ann_title, cosoa_ann_sub_title, cosoa_ann_body } = req.body;
    try {
        const cosoa_ann = await COSOA_ANN.create({
            cosoa_ann_photo: req.file.path,
            cosoa_ann_title: cosoa_ann_title,
            cosoa_ann_sub_title: cosoa_ann_sub_title,   
            cosoa_ann_body: cosoa_ann_body
        });
        res.json(cosoa_ann);
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

module.exports = router;