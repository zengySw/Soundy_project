const { verifyAccessToken, ensureActiveSession } = require('../services/auth.service');

async function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing Bearer token' });
    }

    const token = header.split(' ')[1]?.trim();
    if (!token) return res.status(401).json({ message: 'Missing Bearer token' });

    try {
        const auth_user = verifyAccessToken(token);
        await ensureActiveSession(auth_user);
        req.auth_user = auth_user;
        next();
    } catch (error) {
        return res.status(401).json({ message: error.message || 'Unauthorized' });
    }
}

module.exports = { authMiddleware };