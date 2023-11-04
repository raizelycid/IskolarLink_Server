const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken){
        return res.json({ error: "User not logged in!" });
    }else{
        try{
            jwt.verify(accessToken, 'spongebobsquarepants', (err, decoded) => {
                if(err){
                    return res.json({ error: err });
                }else{
                    req.decoded = decoded;
                    next();
                } 
            });
        }catch(err){
            return res.json({ error: err });
        }
    }
}

module.exports = validateToken; 