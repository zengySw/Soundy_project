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