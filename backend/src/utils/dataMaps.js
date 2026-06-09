const Fuse = require('fuse.js');

function mapDeezerTrack(track) {
    return {
        source: "deezer",
        rank: 1.0,

        external_id: String(track.id),
        title: track.title,
        artists: [{ name: track.artist?.name || "Unknown", subscribers: null }],
        album: track.album?.title || null,
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
        album: track.album_name || null,
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
            { name: 'title', weight: 0.7 },
            { name: 'artist', weight: 0.3 }
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

function mapDeezerAlbum(album) {
    return {
        source: "deezer",
        rank: 1.0,
        external_id: String(album.id),
        title: album.title,
        artists: [{ name: album.artist_name || "Unknown", subscribers: null }],
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

module.exports = { mapAudiusTrack, mapDeezerTrack, mapJamendoTrack, rankTracks, rankAlbums, mapDeezerAlbum, mapDeezerArtist };