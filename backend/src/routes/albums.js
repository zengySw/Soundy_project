var express = require('express');
const router = express.Router();

var db = require('../config/db');

const { getAlbums } = require('../repositories/albums.repo');

router.get('/', async (req, res) => {
    return res.json(await getAlbums(req.query.id.split(',') || req.query.ids.split(',')));
});

router.get('/:id', async (req, res) => {
    return res.json(await getAlbums(req.params.id.split(',')));
});

module.exports = router;