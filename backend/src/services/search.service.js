const { findTracks, saveTracks } = require('../repositories/tracks.repo');
const { findAlbums, saveAlbums } = require('../repositories/albums.repo');
const { findArtists, saveArtists } = require('../repositories/artists.repo');
const { searchDeezerTracks, searchDeezerMp3, searchDeezerAlbums, searchDeezerArtists } = require("../external/deezer");
const { mapDeezerTrack, mapDeezerAlbum, mapDeezerArtist } = require('../utils/dataMaps');
const { searchJamendoMp3 } = require('../external/jamendo');
const { searchAudiusMp3 } = require('../external/audius');

async function searchTracks(q, limit = 1) {

    const queries = q.split(",").map(s => s.trim()).filter(Boolean);

    const results = [];

    for (const query of queries) {
        const local = await findTracks(query, limit);
        if (local.length) { results.push(...local); continue; }

        const res = await searchDeezerTracks(query).then(tracks => tracks.map(t => mapDeezerTrack(t)));

        for (const t of res) {
            const album = await findAlbums(t.album.title)[0];
            if (!album) t.album = await searchAlbums(t.album.title || t.album, 1)[0];
            else t.album = album;
            const artist = await findArtists(t.artists.map(artist => artist.name, 1)[0]);
            if (!artist) t.artists = await searchArtists(t.artists.map(a => a.name) || t.artist, 1);
            else t.artist = artist;
            if (!t.path) t.path = await outSearchMp3(t.title + '' + t.author.name);
        }

        console.log(res);

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

async function searchAlbums(q, limit = 1) {
    const queries = q.split(",").map(s => s.trim()).filter(Boolean);

    const results = []

    for (const query of queries) {
        const local = await findAlbums(query, limit);
        if (local.length) return local;

        const res = await searchDeezerAlbums(query).then(albums => albums.map(a => mapDeezerAlbum(a)));

        for (const a of res) {
            const artists = await findArtists(a.artists.map(artist => artist.name, 1));
            if (!artists) a.artists = await searchArtists(a.artists.map(artist => artist.name) || a.artist, 1);
            else a.artists = artists;
        }

        await saveAlbums(res);
        results.push(...await findAlbums(res, limit));
    }
    return results || [];
}

async function searchArtists(q, limit = 1) {
    const queries = q?.split(",").map(s => s.trim()).filter(Boolean) || '';

    const results = []

    for (const query of queries) {
        const local = await findArtists(query, limit);
        if (local.length) { results.push(...local); continue; }
        const res = await searchDeezerArtists(query).then(a => a.map(a => mapDeezerArtist(a)));
        await saveArtists(res);
        results.push(...await findArtists(query, limit));
    }

    return results;
}

module.exports = { searchAlbums, searchArtists, searchTracks };