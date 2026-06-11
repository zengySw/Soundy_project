var express = require('express');
const router = express.Router();

var db = require('../config/db');

const { searchTracks, searchAlbums, searchArtists, searchPlaylists } = require('../services/search.service');

router.get('/', async (req, res) => {
    return res.json({
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
        limit = parseInt(req.query.limit) || 20;
        return res.json({ artists: await searchArtists(req.query.q || '', limit) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Search failed" });
    }
});

router.get('/albums', async (req, res) => {
    try {
        limit = parseInt(req.query.limit) || 20;
        return res.json({ albums: await searchAlbums(req.query.q || '', limit) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Search failed" });
    }
});

router.get('/playlists', async (req, res) => {
    try {
        limit = parseInt(req.query.limit) || 20;
        return res.json({ playlists: await searchPlaylists(req.query.q || '', limit) })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Search failed" });
    }
});

module.exports = router;