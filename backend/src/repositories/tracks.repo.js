const db = require('../config/db');

async function findTracks(q, limit = 20) {
    return await db.query(`
            SELECT 
                t.*,
                json_agg(
                    json_build_object(
                    a.*
                    )
                ),
                json_build_object (
                    al.*
                ),
                GREATEST(
                    similarity(t.title, $1),
                    similarity(a.name, $1)
                ) AS score
            FROM tracks t JOIN tracks_compositors tc ON t.id = tc.track_id JOIN artists a ON tc.author_id = a.id join albums al on al.id = t.album_id
            WHERE t.title % $1 OR a.name % $1
            GROUP BY t.id, al.*, a.name
            ORDER BY score DESC
            LIMIT $2;
        `, [q || '', limit]).then(r => r.rows);
}

async function saveTracks(tracks) {
    const ids = [];

    for (const t of tracks) {

        const result = await db.query(`
            INSERT INTO tracks (
                album_id,
                title,
                duration_ms,
                path,
                cover_path
            )
            VALUES ($1,$2,$3,$4,$5)
            ON CONFLICT (path)
            DO UPDATE SET
                title = EXCLUDED.title,
                cover_path = EXCLUDED.cover_path
            RETURNING id;
        `, [
            t.album_id,
            t.title,
            t.duration_ms,
            t.path,
            t.cover_path,
        ]);
        for (const artist of t.artists) {
            await db.query(`
        INSERT INTO tracks_compositors (track_id, author_id)
        VALUES ( $1, $2 )
        ON CONFLICT DO NOTHING;
    `, [result.rows[0].id, artist.id]);
        }
        ids.push(result.rows[0].id);
    }

    return ids;
}

module.exports = { findTracks, saveTracks };