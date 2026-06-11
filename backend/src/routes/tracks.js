var express = require('express');
const router = express.Router();

var db = require('../config/db');

const { getTracks } = require('../repositories/tracks.repo');

router.get('/', async (req, res) => {
    return res.json(await getTracks(req.query.id.split(',') || req.query.ids.split(',')));
});

router.get('/:id', async (req, res) => {
    return res.json(await getTracks(req.params.id.split(',')));
});

module.exports = router;