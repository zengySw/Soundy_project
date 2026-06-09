const { findTracks, saveTracks } = require('../repositories/tracks.repo');
const { findAlbums, saveAlbums } = require('../repositories/albums.repo');
const { findArtists, saveArtists } = require('../repositories/artists.repo');
const { searchDeezerTracks, searchDeezerMp3, searchDeezerAlbums, searchDeezerArtists } = require("../external/deezer");
const { mapDeezerTrack, mapDeezerAlbum, mapDeezerArtist } = require('../utils/dataMaps');
const { searchJamendoMp3 } = require('../external/jamendo');
const { searchAudiusMp3 } = require('../external/audius');

async function searchTracks(q, limit = 20) {

    const queries = q.split(",").map(s => s.trim()).filter(Boolean);

    const results = [];

    for (const query of queries) {
        const local = await findTracks(query, limit);
        if (local.length) { results.push(...local); continue; }

        const res = await searchDeezerTracks(query).then(t => mapDeezerTrack(t));

        for (const t of res) {
            if (!findAlbums(t.album.title)) t.album = searchAlbums(t.album.title, limit = 1);
            if (!findArtists(t.artists.map(a => a.name))) t.artists = searchArtists(t.artists.map(a => a.name), limit = 1);
            if (!t.path) t.pah = outSearchMp3(t.title + '' + t.author.name);
        }

        await saveTracks(res);
        results.push(...await findTracks(query, limit));
    }

    return results;
}

async function outSearchMp3(q) {
    const candidates = [];

    await searchDeezerMp3(q, candidates);
    await searchJamendoMp3(q, candidates);
    await searchAudiusMp3(q, candidates);

    return rankTracks(candidates, q)[0].path;
}

async function searchAlbums(q, limit = 20) {
    const queries = q.split(",").map(s => s.trim()).filter(Boolean);

    const results = []

    for (const query of queries) {
        const local = await findAlbums(q, limit);
        if (local.length) return local;

        const res = await searchDeezerAlbums(q).then(a => mapDeezerAlbum(a));

        for (const a of res) {
            if (!findArtists(a.artists.map(a => a.name))) a.artists = searchArtists(a.artists.map(a => a.name), limit = 1);
        }

        saveAlbums(res);
        results.push(...await findAlbums(res, limit));
    }
    return results || [];
}

async function searchArtists(q, limit = 20) {
    const queries = q.split(",").map(s => s.trim()).filter(Boolean);

    const results = []

    for (const query of queries) {
        const local = await findArtists(q, limit);
        if (local.length) return local;
        const res = await searchDeezerArtists(q).then(a => mapDeezerArtist(a));
        saveArtists(res);
        results.push(...await findArtists(q, limit));
    }

    return results;
}

module.exports = { searchAlbums, searchArtists, searchTracks };