var express = require('express');
var router = express.Router();

var db = require('./src/config/db');

router.get('/', async (req, res) => {
    res.json(await db.query('SELECT * FROM tracks WHERE id IN (?)', [req.query.ids]));
    res.map((track) => {
        track.alum = db.query('SELECT * FROM albums JOIN albums_tracks ON albums.id = albums_tracks.album_id JOIN tracks ON albums_tracks.track_id = tracks.id WHERE tracks.id = ?', [track.id]);
        track.authors = db.query('SELECT * FROM users JOIN tracks_compositors ON users.id = tracks_compositors.artist_id JOIN tracks ON tracks_compositors.track_id = tracks.id WHERE tracks.id = ?', [track.id]);
    });
});

router.get('/:id', async (req, res) => {
    res.json(await db.query('SELECT * FROM tracks WHERE id = ?', [req.params.id]));
    res.map((track) => {
        track.alum = db.query('SELECT * FROM albums JOIN albums_tracks ON albums.id = albums_tracks.album_id JOIN tracks ON albums_tracks.track_id = tracks.id WHERE tracks.id = ?', [track.id]);
        track.authors = db.query('SELECT * FROM users JOIN tracks_compositors ON users.id = tracks_compositors.artist_id JOIN tracks ON tracks_compositors.track_id = tracks.id WHERE tracks.id = ?', [track.id]);
    });
    res = res[0];
});

module.exports = router;