const { mapDeezerTrack } = require("../utils/dataMaps");

const API = 'https://api.deezer.com';

async function searchDeezerTracks(q) {
    const res = await fetch(`${API}/search?q=${q}`);
    const json = await res.json();
    return json.data || [];
}

async function searchDeezerAlbums(q) {
    const res = await fetch(`${API}/search/album?q=${q}`);
    const json = await res.json();
    return json.data || [];
}

async function searchDeezerArtists(q) {
    const res = await fetch(`${API}/search/artist?q=${q}`);
    const json = await res.json();
    return json.data || [];
}

async function searchDeezerMp3(q, candidates) {
    try {
        const res = await fetch(
            `https://api.deezer.com/search?q=${encodeURIComponent(q)}`
        );

        const json = await res.json();

        for (const t of json.data || []) {
            if (!t?.preview) continue;

            candidates.push(mapDeezerTrack(t));
        }

    } catch (e) {
        console.warn("[Deezer error]", e.message);
    }
}

module.exports = { searchDeezerAlbums, searchDeezerArtists, searchDeezerTracks, searchDeezerMp3 };