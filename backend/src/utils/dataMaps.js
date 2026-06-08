const Fuse = require('fuse.js');

function mapDeezerTrack(track) {
    return {
        source: "deezer",
        rank: 1.0,

        external_id: String(track.id),
        title: track.title,
        artist: track.artist?.name || "Unknown",
        album: track.album?.title || null,
        duration_ms: track.duration * 1000,
        artwork: track.album?.cover_xl,
        url: track.preview
    };
}

function mapJamendoTrack(track) {
    return {
        source: "jamendo",
        rank: 0.6,

        external_id: String(track.id),
        title: track.name,
        artist: track.artist_name,
        album: track.album_name || null,
        duration_ms: track.duration,
        artwork: track.album_image || track.image,
        url: track.audio
    };
}

function mapAudiusTrack(track) {
    return {
        source: "audius",
        rank: 0.8,

        external_id: String(track.id),
        title: track.title,
        artist: track.user?.name || "Unknown",
        album: null,
        duration_ms: track.duration,
        artwork: track.artwork?.["480x480"],
        url: track.stream?.url
    };
}

function rankTracks(tracks, query) {

    const fuse = new Fuse(tracks, {
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

function mapPlaylist(playlist, tracks) {
    return {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        tracks
    };
}

module.exports = { mapAudiusTrack, mapDeezerTrack, mapJamendoTrack, rankTracks, mapPlaylist };