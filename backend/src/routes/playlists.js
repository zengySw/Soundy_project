var express = require('express');
const router = express.Router();

var db = require('../config/db');

const { getPlaylists } = require('../repositories/playlists.repo');

router.get('/', async (req, res) => {
    return res.json(await getPlaylists(req.query.id.split(',') || req.query.ids.split(',')));
});

router.get('/:id', async (req, res) => {
    return res.json(await getPlaylists(req.params.id.split(',')));
});

module.exports = router;