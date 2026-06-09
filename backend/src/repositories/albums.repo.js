const db = require('../config/db');

async function findAlbums(q, limit = 20) {
    return await db.query(`
            SELECT
                *,
                t.*,
                a.*,
                similarity(albums.title, $1) AS score,
                similarity(a.name, $1) AS author_score
            FROM albums
            JOIN albums_compositors ac ON albums.id = ac.album_id
            JOIN artists a ON ac.artist_id = a.id
            Join tracks t ON albums.id = t.album_id
            WHERE albums.title % $1
            ORDER BY score DESC
            LIMIT $2;
        `, [q || '', limit]).then(r => r.rows);
};

async function saveAlbums(albums) {

    const ids = [];

    for (const a of albums) {
        const result = await db.query(`
        INSERT INTO albums (title, year, cover_path)
        VALUES ($1, $2, $3)
        RETURNING id
        
        `, [a.title, a.year, a.cover_path]);

        console.log(a);

        for (const artist of a.artists) {
            await db.query(`
            Insert into albums_compositors (album_id, artist_id)
            values ($1, $2)
            `, [result.rows[0].id, artist.id]);

            ids.push(result.rows[0].id);
        }
    }

    return ids;
}

module.exports = { findAlbums, saveAlbums };