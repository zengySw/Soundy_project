// routes/auth.js
const express = require('express');
const router = express.Router();
const service = require('../services/auth.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/register', async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        if (!email || !username || !password)
            return res.status(400).json({ message: 'Expected { email, username, password }' });
        res.status(201).json(await service.register(email, username, password, req.get('user-agent')));
    } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'Expected { email, password }' });
        res.json(await service.login(email, password, req.get('user-agent')));
    } catch (err) { next(err); }
});

router.post('/logout', authMiddleware, async (req, res, next) => {
    try {
        await service.logout(req.auth_user.user_id, req.auth_user.session_id);
        res.status(204).send();
    } catch (err) { next(err); }
});

module.exports = router;