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

router.post('/tracks', async (req, res) => {
    req.body.tracks.map((track) => {
        sTrack = db.query('SELECT * FROM tracks JOIN tracks_compositors ON tracks.id = tracks_compositors.track_id JOIN users ON tracks_compositors.artist_id = users.id WHERE tracks.title = ? AND users.name = ?', [track.title, track.authors]);
    });
    if (sTrack) {
        res.json.tracks.append(sTrack);
    }
    else () => { };
});

module.exports = router;