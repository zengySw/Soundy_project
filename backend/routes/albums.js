var express = require('express');
var router = express.Router();

const { Pool } = require('pg');
const db = new Pool({
    connectionString: process.env.DB_URL
});

router.get('/', async (req, res) => {
    res.json(await db.query('SELECT * FROM albums WHERE id IN (?)', [req.query.ids]));
    res.map((album) => {
        album.tracks = db.query('SELECT * FROM tracks JOIN albums_tracks ON albums.id = albums_tracks.album_id JOIN tracks ON albums_tracks.track_id = tracks.id WHERE albums.id = ?', [album.id]);
    });
    res.map((album) => {
        album.authors = db.query('SELECT * FROM users JOIN albums_compositors ON users.id = albums_compositors.artist_id JOIN albums ON albums_compositors.album_id = albums.id WHERE albums.id = ?', [album.id]);
    });
});

router.get('/:id', async (req, res) => {
    res.json(await db.query('SELECT * FROM albums WHERE id = ?', [req.params.id]));
    res.map((album) => {
        album.tracks = db.query('SELECT * FROM tracks JOIN albums_tracks ON albums.id = albums_tracks.album_id JOIN tracks ON albums_tracks.track_id = tracks.id WHERE albums.id = ?', [req.params.id]);
    });
    res.map((album) => {
        album.authors = db.query('SELECT * FROM users JOIN albums_compositors ON users.id = albums_compositors.artist_id JOIN albums ON albums_compositors.album_id = albums.id WHERE albums.id = ?', [req.params.id]);
    });
    res = res[0];
});

module.exports = router;