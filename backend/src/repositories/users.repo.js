const db = require('../config/db');

// --- me ---

async function findUserById(id) {
    return await db.query(`
        SELECT
            id, email, username, avatar_url,
            is_premium, country_code, theme_config,
            created_at, updated_at
        FROM users
        WHERE id = $1
        LIMIT 1;
    `, [id]).then(r => r.rows[0] || null);
}

async function updateUser(id, data) {
    const fields = [];
    const values = [];
    let i = 1;

    if (data.username !== undefined) { fields.push(`username = $${i++}`); values.push(data.username); }
    if (data.avatar_url !== undefined) { fields.push(`avatar_url = $${i++}`); values.push(data.avatar_url); }
    if (data.country_code !== undefined) { fields.push(`country_code = $${i++}`); values.push(data.country_code); }
    if (data.theme_config !== undefined) { fields.push(`theme_config = $${i++}`); values.push(data.theme_config); }

    if (!fields.length) return null;
    values.push(id);

    return await db.query(`
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${i}
        RETURNING id, email, username, avatar_url, is_premium, country_code, theme_config, updated_at;
    `, values).then(r => r.rows[0] || null);
}

async function deleteUser(id) {
    return await db.query(`
        DELETE FROM users
        WHERE id = $1
        RETURNING id;
    `, [id]).then(r => r.rows[0] || null);
}

// --- favorites ---

async function findFavorites(userId, limit = 20, offset = 0) {
    return await db.query(`
        SELECT
            t.*,
            json_agg(
                json_build_object('id', a.id, 'name', a.name, 'subscribers', a.subscribers)
            ) FILTER (WHERE a.id IS NOT NULL) AS artists,
            json_build_object('id', al.id, 'title', al.title, 'cover_path', al.cover_path) AS album,
            f.added_at
        FROM favorites f
        JOIN tracks t ON f.track_id = t.id
        LEFT JOIN tracks_compositors tc ON t.id = tc.track_id
        LEFT JOIN artists a ON tc.author_id = a.id
        LEFT JOIN albums al ON al.id = t.album_id
        WHERE f.user_id = $1
        GROUP BY t.id, al.id, al.title, al.cover_path, f.added_at
        ORDER BY f.added_at DESC
        LIMIT $2 OFFSET $3;
    `, [userId, limit, offset]).then(r => r.rows);
}

async function addFavorite(userId, trackId) {
    return await db.query(`
        INSERT INTO favorites (user_id, track_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING *;
    `, [userId, trackId]).then(r => r.rows[0] || null);
}

async function removeFavorite(userId, trackId) {
    return await db.query(`
        DELETE FROM favorites
        WHERE user_id = $1 AND track_id = $2
        RETURNING *;
    `, [userId, trackId]).then(r => r.rows[0] || null);
}

// --- library (playlists) ---

async function findLibrary(userId, limit = 20, offset = 0) {
    return await db.query(`
        SELECT
            p.*,
            json_build_object('id', u.id, 'username', u.username, 'avatar_url', u.avatar_url) AS owner,
            COUNT(pt.track_id) AS track_count
        FROM playlists p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
        WHERE p.owner_id = $1
           OR EXISTS (
               SELECT 1 FROM playlist_collaborators pc
               WHERE pc.playlist_id = p.id AND pc.user_id = $1
           )
        GROUP BY p.id, u.id, u.username, u.avatar_url
        ORDER BY p.updated_at DESC
        LIMIT $2 OFFSET $3;
    `, [userId, limit, offset]).then(r => r.rows);
}

async function addToLibrary(userId, playlistId) {
    return await db.query(`
        INSERT INTO playlist_collaborators (playlist_id, user_id, role)
        VALUES ($1, $2, 'viewer')
        ON CONFLICT DO NOTHING
        RETURNING *;
    `, [playlistId, userId]).then(r => r.rows[0] || null);
}

async function removeFromLibrary(userId, playlistId) {
    return await db.query(`
        DELETE FROM playlist_collaborators
        WHERE playlist_id = $1 AND user_id = $2
        RETURNING *;
    `, [playlistId, userId]).then(r => r.rows[0] || null);
}

// --- sessions ---

async function findSessions(userId) {
    return await db.query(`
        SELECT id, device_info, last_used_at, expires_at, created_at
        FROM user_sessions
        WHERE user_id = $1 AND revoked = FALSE AND expires_at > now()
        ORDER BY last_used_at DESC;
    `, [userId]).then(r => r.rows);
}

async function revokeSession(sessionId, userId) {
    return await db.query(`
        UPDATE user_sessions
        SET revoked = TRUE
        WHERE id = $1 AND user_id = $2
        RETURNING id;
    `, [sessionId, userId]).then(r => r.rows[0] || null);
}

async function revokeAllSessions(userId) {
    return await db.query(`
        UPDATE user_sessions
        SET revoked = TRUE
        WHERE user_id = $1 AND revoked = FALSE
        RETURNING id;
    `, [userId]).then(r => r.rows);
}

module.exports = {
    findUserById,
    updateUser,
    deleteUser,
    findFavorites,
    addFavorite,
    removeFavorite,
    findLibrary,
    addToLibrary,
    removeFromLibrary,
    findSessions,
    revokeSession,
    revokeAllSessions,
};