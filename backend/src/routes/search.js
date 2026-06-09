var express = require('express');
var router = express.Router();

var db = require('../config/db');

const { searchTracks, searchAlbums, searchArtists } = require('../services/search.service');

router.get('/', async (req, res) => {
    res.json({
        tracks: await searchTracks(encodeURIComponent(req.query.q)),
        albums: await searchAlbums(encodeURIComponent(req.query.q)),
        artists: await searchArtists(encodeURIComponent(req.query.q))
    });
});

router.get('/tracks', async (req, res) => {
    try {
        limit = parseInt(req.query.limit) || 20;
        return res.json({ tracks: await searchTracks(req.query.q || '', limit) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Search failed" });
    }
});

router.get('/artists', async (req, res) => {
    try {
        return res.json({ artists: await searchArtists(encodeURIComponent(req.query.q)) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Search failed" });
    }
});

router.get('/albums', async (req, res) => {
    try {
        return res.json({ albums: await searchAlbums(encodeURIComponent(req.query.q)) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Search failed" });
    }
});

// router.get('/playlists', async (req, res) => {
//     try {
//         const result = await db.query(`
//             SELECT 
//                 *,
//                 similarity(name, $1) AS score
//             FROM playlists
//             WHERE name % $1
//             ORDER BY score DESC
//             LIMIT 20;
//         `, [req.query.q || '']);

//         if (result.rows.length === 0) {
//             () => { console.log("No playlists found, searching on another platforms..."); } // find on another platforms
//         }

//         return res.json({ playlists: result.rows });

//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ error: err.message || "Search failed" });
//     }
// });

module.exports = router;