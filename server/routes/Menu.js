const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

router.use(cookieParser());

router.post('/', async (req, res) => {
    const { menu } = req.body;
    // Check if the cookie is present
    const menuCookies = req.cookies.menuToken;
    if (!menuCookies){
        // If the cookie is not present, create a new one
        const menuToken = jwt.sign({ menu: menu }, 'spongebobsquarepants', {
            expiresIn: '1d'
        });
        res.cookie('menuToken', menuToken, { httpOnly: true });
        res.json({ menu: menu });
    }
    else{
        // If the cookie is present, verify and change the menu
        jwt.verify(menuToken, 'spongebobsquarepants', (err, decoded) => {
            if(err){
                return res.json({ error: err });
            }else{
                const menuToken = jwt.sign({ menu: menu }, 'spongebobsquarepants', {
                    expiresIn: '1d'
                });
                res.cookie('menuToken', menuToken, { httpOnly: true });
                res.json({ menu: menu });
            }
        });
    }
});

router.get('/', async (req, res) => {
    // Check if the cookie is present
    const menuCookies = req.cookies.menuToken;
    if (!menuCookies){
        // If the cookie is not present, create a new one
        let menu = "main";
        const menuToken = jwt.sign({ menu: 'main' }, 'spongebobsquarepants', {
            expiresIn: '1d'
        });
        res.cookie('menuToken', menuToken, { httpOnly: true });
        res.json({ menu: menu });
    }else{
        // If the cookie is present, get the menu
        jwt.verify(menuToken, 'spongebobsquarepants', (err, decoded) => {
            if(err){
                return res.json({ error: err });
            }else{
                res.json({ menu: decoded.menu });
            }
        });
    }
});

module.exports = router;