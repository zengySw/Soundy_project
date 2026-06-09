const { findTracks, saveTracks } = require('../repositories/tracks.repo');
const { findAlbums, saveAlbums } = require('../repositories/albums.repo');
const { findArtists, saveArtists } = require('../repositories/artists.repo');
const { searchDeezerTracks, searchDeezerMp3, searchDeezerAlbums, searchDeezerArtists } = require("../external/deezer");
const { mapDeezerTrack, mapDeezerAlbum, mapDeezerArtist } = require('../utils/dataMaps');
const { searchJamendoMp3 } = require('../external/jamendo');
const { searchAudiusMp3 } = require('../external/audius');

async function searchTracks(q, limit = 1) {
    if (!q || !q.length) return await findTracks(q, limit);
    const queries = q.split(",").map(s => s.trim()).filter(Boolean);

    console.log(queries);

    const results = [];

    for (const query of queries) {
        const local = await findTracks(query, limit);
        if (local.length) { results.push(...local); continue; }

        const res = await searchDeezerTracks(query).then(tracks => tracks.map(t => mapDeezerTrack(t)));

        for (const t of res) {
            const album = (await findAlbums(t.album.title))[0];
            if (!album) t.album = (await searchAlbums(t.album.title, 1))[0] || null;
            else t.album = album;
            t.artists = await Promise.all(
                t.artists.map(async (a) => {
                    const found = (await findArtists(a.name))[0];
                    return found || (await searchArtists(a.name, 1))[0] || a;
                })
            );
            if (!t.path) t.path = await outSearchMp3(t.title + '' + t.author.name);
        }

        const ids = await saveTracks(res);
        results.push(...await findTracks(query, limit)); // rework on ids search
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
    if (!q || !q.length) return await findAlbums(q, limit);
    const queries = q.split(",").map(s => s.trim()).filter(Boolean);

    const results = []

    for (const query of queries) {
        const local = await findAlbums(query, limit);
        if (local.length) { results.push(...local); continue; }

        const res = await searchDeezerAlbums(query, 1).then(albums => albums.map(a => mapDeezerAlbum(a)));

        for (const a of res) {
            a.artists = await Promise.all(
                a.artists.map(async (artist) => {
                    const found = (await findArtists(artist.name))[0];
                    return found || (await searchArtists(artist.name, 1))[0] || artist;
                })
            );
        }

        await saveAlbums(res);
        results.push(...await findAlbums(query, limit));
    }
    return results;
}

async function searchArtists(q, limit = 1) {
    if (!q || !q.length) return await findArtists(q, limit);
    const queries = q?.split(",").map(s => s.trim()).filter(Boolean);

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