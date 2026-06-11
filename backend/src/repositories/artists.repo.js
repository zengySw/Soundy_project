const db = require('../config/db');

async function findArtists(q = ' ', limit = 20) {
    return await db.query(`
            SELECT 
                *,
                similarity(name, $1) AS score
            FROM artists
            WHERE name % $1
            ORDER BY score DESC
            LIMIT $2;
        `, [q, limit]).then(r => r.rows);
}

async function getArtists(ids) {
    return await db.query(`
        SELECT
        *
        FROM artists a
        WHERE id = ANY($1)
        ORDER by id
        `, [ids]).then(r => r.rows);
}

async function saveArtists(artists) {
    const ids = [];
    for (const a of artists) {
        const result = await db.query(`
        INSERT INTO artists (name, subscribers)
        VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name, subscribers = EXCLUDED.subscribers
        RETURNING id
    `, [a.name, a.subscribers]);

        ids.push(result.rows[0].id);
    }

    return ids;
}


module.exports = { findArtists, saveArtists, getArtists };