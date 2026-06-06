var express = require('express');
var router = express.Router();

var db = require('../config/db');

router.get('/', async (req, res) => {
    res.json(await db.query('SELECT * FROM playlists WHERE id IN (?)', [req.query.ids]));
    res.map((playlist) => {
        playlist.tracks = db.query('SELECT * FROM tracks JOIN playlists_tracks ON playlists.id = playlists_tracks.playlist_id JOIN tracks ON playlists_tracks.track_id = tracks.id WHERE playlists.id = ?', [playlist.id]);
    });
    res.map((playlist) => {
        playlist.author = db.query('SELECT * FROM users JOIN playlists ON users.id = playlists.owner_id WHERE playlists.id = ?', [playlist.id]);
    });
});

router.get('/:id', async (req, res) => {
    res.json(await db.query('SELECT * FROM playlists WHERE id = ?', [req.params.id]));
    res.map((playlist) => {
        playlist.tracks = db.query('SELECT * FROM tracks JOIN playlists_tracks ON playlists.id = playlists_tracks.playlist_id JOIN tracks ON playlists_tracks.track_id = tracks.id WHERE playlists.id = ?', [req.params.id]);
    });
    res.map((playlist) => {
        playlist.author = db.query('SELECT * FROM users JOIN playlists ON users.id = playlists.owner_id WHERE playlists.id = ?', [req.params.id]);
    });
    res = res[0];
});

module.exports = router;