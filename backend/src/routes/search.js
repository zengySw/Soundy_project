var express = require('express');
var router = express.Router();

var db = require('../config/db');

const { outSearch } = require('../services/outSearch');
const { saveTracks } = require('../utils/fillDb');

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
                a.name,
                a.id,
                GREATEST(
                    similarity(t.title, $1),
                    similarity(a.name, $1)
                ) AS score
            FROM tracks t JOIN tracks_compositors tc ON t.id = tc.track_id JOIN artists a ON tc.author_id = a.id
            WHERE t.title % $1 OR a.name % $1
            ORDER BY score DESC
            LIMIT 20;
        `, [req.query.q || '']);

        if (result.rows.length == 0) {
            // () => { throw new Error("No tracks found, searching on another platforms..."); } // find on another platforms
            const externalTracks = await outSearch(req.query.q);
            const ids = await saveTracks(externalTracks);
            return res.json({
                tracks: await db.query(`
             SELECT 
                *,
                a.name,
                a.id,
                GREATEST(
                    similarity(t.title, $1),
                    similarity(a.name, $1)
                ) AS score
            FROM tracks t JOIN tracks_compositors tc ON t.id = tc.track_id JOIN artists a ON tc.author_id = a.id
            WHERE t.title % $1 OR a.name % $1
            ORDER BY score DESC
            LIMIT 20;
        `, [ids]).rows
            });
        }

        return res.json({ tracks: result.rows });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Search failed" });
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
        `, [req.query.q || '']);

        if (result.rows.length === 0) {
            () => { console.log("No artists found, searching on another platforms..."); } // find on another platforms
        }

        return res.json({ artists: result.rows });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Search failed" });
    }
});

router.get('/albums', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                *,
                similarity(name, $1) AS score
            FROM albums
            WHERE name % $1
            ORDER BY score DESC
            LIMIT 20;
        `, [req.query.q || '']);

        if (result.rows.length === 0) {
            () => { console.log("No albums found, searching on another platforms..."); } // find on another platforms
        }

        return res.json({ albums: result.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Search failed" });
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
        `, [req.query.q || '']);

        if (result.rows.length === 0) {
            () => { console.log("No playlists found, searching on another platforms..."); } // find on another platforms
        }

        return res.json({ playlists: result.rows });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Search failed" });
    }
});

module.exports = router;