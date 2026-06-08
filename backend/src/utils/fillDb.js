const db = require('../config/db');

const { outSearchMp3 } = require('../services/outSearch');
const { rankTracks } = require('../utils/dataMaps');

async function saveTracks(tracks) {
    const ids = [];

    for (const t of tracks) {
        if (!t.url) continue;

        if (!t.path) {
            const result = await outSearchMp3(t.title + " " + t.artist);
            t.path = result?.[0]?.mp3 || null;
        }

        console.log(t);

        const artistId = await fetch(`/artists?q=${encodeURIComponent(t.artist)}`).then(res => res.json()).then(data => data.artists?.[0]?.id);
        const albumId = await fetch(`/albums?q=${encodeURIComponent(t.album)}`).then(res => res.json()).then(data => data.albums?.[0]?.id);

        const result = await db.query(`
            INSERT INTO tracks (
                title,
                duration_ms,
                path,
                cover_path
            )
            VALUES ($1,$2,$3,$4)
            ON CONFLICT (path)
            DO UPDATE SET
                title = EXCLUDED.title,
                cover_path = EXCLUDED.cover_path
            RETURNING id;
            INSERT INTO tracks_compositors (track_id, author_id)
            VALUES (
                (SELECT id FROM tracks WHERE path = $3),
                $5
            )
            ON CONFLICT DO NOTHING;
        `, [
            t.title,
            t.duration_ms,
            t.mp3,
            t.path
        ]);

        ids.push(result.rows[0].id);
    }

    return ids;
}

async function saveAuthor(author) {
    const result = await db.query(`
        INSERT INTO artists (name, subscribers)
        VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name, subscribers = EXCLUDED.subscribers
        RETURNING id
    `, [author.name, author.subscribers]);

    return result.rows[0].id;
}

async function fillPlaylist(playlist) {

    if (!playlist.id) {
        const created = await db.query(`
            INSERT INTO playlists (name, description)
            VALUES ($1, $2)
            RETURNING id
        `, [playlist.name, playlist.description]);

        playlistId = created.rows[0].id;
    }

    if (!playlist.tracks?.length) {
        return { playlistId, added: 0 };
    }

    const trackIds = await saveTracks(playlist.tracks);

    if (!trackIds.length) {
        return { playlistId, added: 0 };
    }

    await db.query(`
        INSERT INTO playlist_tracks (playlist_id, track_id)
        SELECT $1, unnest($2::uuid[])
        ON CONFLICT DO NOTHING
    `, [playlistId, trackIds]);

    return {
        playlistId,
        added: trackIds.length
    };
}

module.exports = { saveTracks, fillPlaylist };