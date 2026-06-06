var express = require('express');
var router = express.Router();

var db = require('./src/config/db');

router.get('/', (req, res) => {
    // мб будем брать отсюда id и уже через роуты отдавать фулл обьекты
    res.json({
        tracks: db.query('SELECT * FROM tracks WHERE name ILIKE ?', [`%${req.query.q}%`]),
        albums: db.query('SELECT * FROM albums WHERE name ILIKE ?', [`%${req.query.q}%`]),
        playlists: db.query('SELECT * FROM playlists WHERE name ILIKE ?', [`%${req.query.q}%`]),
        users: db.query('SELECT * FROM users WHERE name ILIKE ?', [`%${req.query.q}%`])
    });
});

router.get('/tracks', async (req, res) => {
    try {

        const result = await db.query(`
            SELECT 
                *,
                GREATEST(
                    similarity(t.name, $1),
                    similarity(a.name, $1)
                ) AS score
            FROM tracks t, artists a JOIN tracks_collaborators tc ON t.id = tc.track_id JOIN artists a ON tc.artist_id = a.id
            WHERE t.name % $1 OR a.name % $1
            ORDER BY score DESC
            LIMIT 20;
        `, [req.query.q ? req.query.q : '']);

        const tracks = result.rows;

        if (tracks.length === 0) {
            () => { } // find on another platforms
        }

        return res.json({ tracks });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Search failed" });
    }
});

router.get('/artists', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                *,
                similarity(name, $1) AS score
            FROM artists
            WHERE name % $1
            ORDER BY score DESC
            LIMIT 20;
        `, [req.query.q ? req.query.q : '']);

        if (result.rows.length === 0) {
            () => { } // find on another platforms
        }

        return res.json({ artists: result.rows });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Search failed" });
    }
});

router.get('/playlists', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                *,
                similarity(name, $1) AS score
            FROM playlists
            WHERE name % $1
            ORDER BY score DESC
            LIMIT 20;
        `, [req.query.q ? req.query.q : '']);

        if (result.rows.length === 0) {
            () => { } // find on another platforms
        }

        return res.json({ playlists: result.rows });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Search failed" });
    }
});

module.exports = router;