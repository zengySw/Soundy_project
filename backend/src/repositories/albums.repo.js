const db = require('../config/db');

async function findAlbums(q = ' ', limit = 20) {
    return await db.query(`
        SELECT
            albums.*,
            json_agg(
                json_build_object('id', a.id, 'name', a.name, 'subscribers', a.subscribers)
            ) FILTER (WHERE a.id IS NOT NULL) AS artists,
            json_agg(
                json_build_object('id', t.id, 'title', t.title, 'duration_ms', t.duration_ms, 'path', t.path, 'cover_path', t.cover_path)
            ) FILTER (WHERE t.id IS NOT NULL) AS tracks,
            MAX(GREATEST(
                similarity(albums.title, $1),
                similarity(albums.title || ' ' || COALESCE(a.name, ''), $1),
                similarity(COALESCE(a.name, '') || ' ' || albums.title, $1)
            )) AS score
        FROM albums
        LEFT JOIN albums_compositors ac ON albums.id = ac.album_id
        LEFT JOIN artists a ON ac.artist_id = a.id
        LEFT JOIN tracks t ON albums.id = t.album_id
        WHERE albums.id IN (
            SELECT DISTINCT albums.id
            FROM albums
            LEFT JOIN albums_compositors ac ON albums.id = ac.album_id
            LEFT JOIN artists a ON ac.artist_id = a.id
            WHERE albums.title % $1
               OR (albums.title || ' ' || COALESCE(a.name, '')) % $1
               OR (COALESCE(a.name, '') || ' ' || albums.title) % $1
        )
        GROUP BY albums.id
        ORDER BY score DESC
        LIMIT $2;
    `, [q, limit]).then(r => r.rows);
}

async function getAlbums(ids) {
    return await db.query(`
        SELECT
        albums.*,
        json_agg(
            json_build_object('id', a.id, 'name', a.name, 'subscribers', a.subscribers)
        ) FILTER (WHERE a.id IS NOT NULL) AS artists,
        json_agg(
            json_build_object('id', t.id, 'title', t.title, 'duration_ms', t.duration_ms, 'path', t.path, 'cover_path', t.cover_path)
        ) FILTER (WHERE t.id IS NOT NULL) AS tracks
        FROM albums
        LEFT JOIN albums_compositors ac ON albums.id = ac.album_id
        LEFT JOIN artists a ON ac.artist_id = a.id
        LEFT JOIN tracks t ON albums.id = t.album_id
        WHERE albums.id = ANY($1)
        GROUP BY albums.id
        ORDER BY albums.id
        `, [ids]).then(r => r.rows);
}

async function saveAlbums(albums) {

    const ids = [];

    for (const a of albums) {
        const result = await db.query(`
            INSERT INTO albums (title, year, cover_path)
            VALUES ($1, $2, $3)
            RETURNING id
        `, [a.title, a.year, a.cover_path]);

        for (const artist of a.artists) {
            if (!artist.id) continue;
            await db.query(`
            Insert into albums_compositors (album_id, artist_id)
            values ($1, $2)
            ON CONFLICT DO NOTHING
            `, [result.rows[0].id, artist.id]);
        }

        ids.push(result.rows[0].id);
    }

    return ids;
}

module.exports = { findAlbums, saveAlbums, getAlbums };