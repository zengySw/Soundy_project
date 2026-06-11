var express = require('express');
const router = express.Router();

var db = require('../config/db');

const { getArtists } = require('../repositories/artists.repo');

router.get('/', async (req, res) => {
    return res.json(await getArtists(req.query.id.split(',') || req.query.ids.split(',')));
});

router.get('/:id', async (req, res) => {
    return res.json(await getArtists(req.params.id.split(',')));
});

module.exports = router;