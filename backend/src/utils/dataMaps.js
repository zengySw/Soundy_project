const Fuse = require('fuse.js');

function mapDeezerTrack(track) {
    return {
        source: "deezer",
        rank: 1.0,

        external_id: String(track.id),
        title: track.title,
        artists: [{ name: track.artist?.name || "Unknown", subscribers: null }],
        album: { title: track.album?.title || null },
        duration_ms: track.duration * 1000,
        cover_path: track.album?.cover_xl,
        path: track.preview
    };
}

function mapJamendoTrack(track) {
    return {
        source: "jamendo",
        rank: 0.6,

        external_id: String(track.id),
        title: track.name,
        artists: [{ name: track.artist_name || "Unknown", subscribers: null }],
        album: { title: track.album_name || null },
        duration_ms: track.duration,
        cover_path: track.album_image || track.image,
        path: track.audio
    };
}

function mapAudiusTrack(track) {
    return {
        source: "audius",
        rank: 0.8,

        external_id: String(track.id),
        title: track.title,
        artists: [{ name: track.user?.name || "Unknown", subscribers: track.user?.follower_count ?? null }],
        album: null,
        duration_ms: track.duration,
        cover_path: track.artwork?.["480x480"],
        path: track.stream?.url
    };
}

function rankTracks(tracks, query) {

    const fuse = new Fuse(tracks, {
        keys: [
            { name: 'title', weight: 0.7 },
            { name: 'artists.name', weight: 0.3 }
        ],
        includeScore: true,
        threshold: 0.4
    });

    return fuse.search(query)
        .map(r => ({
            ...r.item,
            score: (r.item.rank * 0.6) + ((1 - r.score) * 0.4)
        }))
        .sort((a, b) => b.score - a.score);
}

function rankAlbums(albums, query) {

    const fuse = new Fuse(albums, {
        keys: [
            { name: "title", weight: 0.6 },
            { name: "artists.name", weight: 0.4 }
        ],
        includeScore: true,
        threshold: 0.4,
        ignoreLocation: true
    });

    return fuse.search(query)
        .map(r => ({
            ...r.item,
            score: ((r.item.rank ?? 1) * 0.6) + ((1 - (r.score ?? 1)) * 0.4)
        }))
        .sort((a, b) => b.score - a.score);
}

function mapDeezerAlbum(album) {
    return {
        source: "deezer",
        rank: 1.0,
        external_id: String(album.id),
        title: album.title,
        artists: [{ name: album.artist?.name || "Unknown", subscribers: null }],
        cover_path: album.cover_xl
    };
}

function mapDeezerArtist(artist) {
    return {
        source: "deezer",
        rank: 1.0,
        external_id: String(artist.id),
        name: artist.name,
        subscribers: artist.nb_fans,
        cover_path: artist.picture_xl
    };
}

function mapDeezerPlaylist(p) {
    return {
        name: p.title,
        description: p.description || null,
        cover_path: p.picture_xl || p.picture_big || null,
        owner_id: null,
        owner: {
            name: 'soundy',
            avatar_url: ''
        },
        tracks: (p.tracks || []).map(t => ({
            deezer_id: t.id,
            title: t.title,
            duration_ms: t.duration * 1000,
            path: t.preview || null,
            cover_path: null,
            is_explicit: t.explicit_lyrics,
            position: null,
            artists: [{ name: t.artist.name }],
            album: { title: null }
        })),
        collaborators: []
    };
}

function rankPlaylists(playlists, query) {
    const fuse = new Fuse(playlists, {
        keys: [
            { name: 'name', weight: 0.7 },
            { name: 'owner.username', weight: 0.3 }
        ],
        includeScore: true,
        threshold: 0.4,
        ignoreLocation: true
    });

    return fuse.search(query)
        .map(r => ({
            ...r.item,
            score: ((r.item.fans ?? 1) * 0.6) + ((1 - (r.score ?? 1)) * 0.4)
        }))
        .sort((a, b) => b.score - a.score);
}

module.exports = { mapAudiusTrack, mapDeezerTrack, mapJamendoTrack, rankTracks, rankAlbums, mapDeezerAlbum, mapDeezerArtist, mapDeezerPlaylist, rankPlaylists };