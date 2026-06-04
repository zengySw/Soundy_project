var express = require('express');
var router = express.Router();

var db = require('./src/config/db');

/* GET users listing. */
router.get('/me', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/:id', async (req, res) => {
  res.json(await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]));
  res = res[0];
});

router.get('/liked', async (req, res) => {
  res.json(await db.query('SELECT * FROM tracks JOIN users_likes ON tracks.id = users_likes.track_id JOIN users ON users_likes.user_id = users.id WHERE users.id = ?', [req.query.userId]));
});

router.get('/library', async (req, res) => {
  res.json.albums = (await db.query('SELECT * FROM albums JOIN users_library ON albums.id = users_library.album_id JOIN users ON users_library.user_id = users.id WHERE users.id = ?', [req.query.userId]));
  res.json.tracks = (await db.query('SELECT * FROM tracks JOIN users_library ON tracks.id = users_library.track_id JOIN users ON users_library.user_id = users.id WHERE users.id = ?', [req.query.userId]));
  res.json.playlists = (await db.query('SELECT * FROM playlists JOIN users_library ON playlists.id = users_library.playlist_id JOIN users ON users_library.user_id = users.id WHERE users.id = ?', [req.query.userId]));
});

module.exports = router;
