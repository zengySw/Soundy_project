const { mapDeezerTrack } = require("../utils/dataMaps");

const API = 'https://api.deezer.com';

async function searchDeezerTracks(q, limit = 20) {
    const res = await fetch(`${API}/search?q=${q}&limit=${limit}`);
    const json = await res.json();
    return json.data || [];
}

async function searchDeezerAlbums(q, limit = 20) {
    const res = await fetch(`${API}/search/album?q=${q}&limit=${limit}`);
    const json = await res.json();
    return json.data || [];
}

async function searchDeezerArtists(q, limit = 20) {
    const res = await fetch(`${API}/search/artist?q=${q}&limit=${limit}`);
    const json = await res.json();
    return json.data || [];
}

async function searchDeezerPlaylists(q, limit = 20) {
    const res = await fetch(`${API}/search/playlist?q=${q}&limit=${limit}`);
    const data = await res.json();
    return await Promise.all(
        (data.data || []).map(async (p) => {
            const tracks = await fetch(p.tracklist).then(r => r.json());
            p.tracks = tracks.data || [];
            return p;
        })
    );
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

module.exports = { searchDeezerAlbums, searchDeezerArtists, searchDeezerTracks, searchDeezerPlaylists, searchDeezerMp3 };