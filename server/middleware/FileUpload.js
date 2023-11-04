const multer = require('multer');

const COR_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../cor');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.student_id}.pdf`);
    }
});

const COR_upload = multer({storage: COR_storage});

module.exports = COR_upload;
