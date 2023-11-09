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
        jwt.verify(menuCookies, 'spongebobsquarepants', (err, decoded) => {
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
    const menuToken = req.cookies.menuToken;
    if (!menuToken){
        // If the cookie is not present, create a new one
        let menu = "main";
        const menuCookies = jwt.sign({ menu: 'main' }, 'spongebobsquarepants', {
            expiresIn: '1d'
        });
        res.cookie('menuToken', menuCookies, { httpOnly: true });
        res.json({ menu: menu });
    }else{
        // If the cookie is present, get the menu
        jwt.verify(menuToken, 'spongebobsquarepants', (err, decoded) => {
            if(err){
                return res.json({ error: err });
            }else{
                req.decoded = decoded;
                res.json({ menu: decoded.menu});
            }
        });
    }
});

router.post('/remove', async (req, res) => {
    // Check if the cookie is present
    const menuCookies = req.cookies.menuToken;
    if(menuCookies){
        // If the cookie is present, delete it
        res.clearCookie('menuToken');
        res.json({ menu: 'main' });
    }
});

module.exports = router;