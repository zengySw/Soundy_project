const repo = require('../repositories/users.repo');
const db = require('../config/db');

async function getMe(userId) {
    const user = await repo.findUserById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return user;
}

async function updateMe(userId, data) {
    const allowed = ['username', 'avatar_url', 'country_code', 'theme_config'];
    const filtered = Object.fromEntries(
        Object.entries(data).filter(([k]) => allowed.includes(k))
    );
    if (!Object.keys(filtered).length) {
        throw Object.assign(new Error('No valid fields to update'), { status: 400 });
    }
    const user = await repo.updateUser(userId, filtered);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return user;
}

async function deleteMe(userId) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query(`UPDATE user_sessions SET revoked = TRUE WHERE user_id = $1`, [userId]);
        const result = await client.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [userId]);
        if (!result.rows.length) throw Object.assign(new Error('User not found'), { status: 404 });
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function getFavorites(userId, limit, offset) {
    return await repo.findFavorites(userId, limit, offset);
}

async function addFavorite(userId, trackId) {
    const result = await repo.addFavorite(userId, trackId);
    if (!result) throw Object.assign(new Error('Already in favorites'), { status: 409 });
    return result;
}

async function removeFavorite(userId, trackId) {
    const result = await repo.removeFavorite(userId, trackId);
    if (!result) throw Object.assign(new Error('Not in favorites'), { status: 404 });
    return result;
}

async function getLibrary(userId, limit, offset) {
    return await repo.findLibrary(userId, limit, offset);
}

async function addToLibrary(userId, playlistId) {
    const result = await repo.addToLibrary(userId, playlistId);
    if (!result) throw Object.assign(new Error('Already in library'), { status: 409 });
    return result;
}

async function removeFromLibrary(userId, playlistId) {
    const result = await repo.removeFromLibrary(userId, playlistId);
    if (!result) throw Object.assign(new Error('Not in library'), { status: 404 });
    return result;
}

async function getSessions(userId) {
    return await repo.findSessions(userId);
}

async function revokeSession(userId, sessionId) {
    const result = await repo.revokeSession(sessionId, userId);
    if (!result) throw Object.assign(new Error('Session not found'), { status: 404 });
    return result;
}

async function revokeAllSessions(userId) {
    return await repo.revokeAllSessions(userId);
}

module.exports = {
    getMe, updateMe, deleteMe,
    getFavorites, addFavorite, removeFavorite,
    getLibrary, addToLibrary, removeFromLibrary,
    getSessions, revokeSession, revokeAllSessions,
};