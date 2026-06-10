const db = require('../config/db');

async function findPlaylists(q = ' ', limit = 20) {
    return await db.query(`
        SELECT
            p.*,
            json_build_object(
                'id', u.id,
                'username', u.username,
                'email', u.email,
                'avatar_url', u.avatar_url,
                'is_premium', u.is_premium,
                'country_code', u.country_code
            ) AS owner,
            json_agg(
                json_build_object(
                    'id', cu.id,
                    'username', cu.username,
                    'avatar_url', cu.avatar_url,
                    'role', pc.role
                )
            ) FILTER (WHERE cu.id IS NOT NULL) AS collaborators,
            json_agg(
                json_build_object(
                    'id', t.id,
                    'title', t.title,
                    'year', t.year,
                    'genre', t.genre,
                    'duration_ms', t.duration_ms,
                    'path', t.path,
                    'cover_path', t.cover_path,
                    'is_explicit', t.is_explicit,
                    'play_count', t.play_count,
                    'added_by', pt.added_by,
                    'added_at', pt.added_at,
                    'album_title', al.title,
                    'artists', (
                        SELECT json_agg(a.name)
                        FROM tracks_compositors tc
                        JOIN artists a ON tc.author_id = a.id
                        WHERE tc.track_id = t.id
                    )
                )
            ) FILTER (WHERE t.id IS NOT NULL) AS tracks,
            MAX(GREATEST(
                similarity(p.name, $1),
                similarity(p.name || ' ' || COALESCE(u.username, ''), $1),
                similarity(COALESCE(u.username, '') || ' ' || p.name, $1)
            )) AS score
        FROM playlists p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN playlist_collaborators pc ON p.id = pc.playlist_id
        LEFT JOIN users cu ON pc.user_id = cu.id
        LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
        LEFT JOIN tracks t ON pt.track_id = t.id
        LEFT JOIN albums al ON t.album_id = al.id
        WHERE p.id IN (
            SELECT DISTINCT p.id
            FROM playlists p
            LEFT JOIN users u ON p.owner_id = u.id
            WHERE p.name % $1
               OR (p.name || ' ' || COALESCE(u.username, '')) % $1
               OR (COALESCE(u.username, '') || ' ' || p.name) % $1
        )
        GROUP BY p.id, u.id
        ORDER BY score DESC
        LIMIT $2;
    `, [q, limit]).then(r => r.rows);
}

async function getPlaylists(ids) {
    return await db.query(`
        SELECT
            p.*,
            json_build_object(
                'id', u.id,
                'username', u.username,
                'email', u.email,
                'avatar_url', u.avatar_url,
                'is_premium', u.is_premium,
                'country_code', u.country_code
            ) AS owner,
            json_agg(
                json_build_object(
                    'id', cu.id,
                    'username', cu.username,
                    'avatar_url', cu.avatar_url,
                    'role', pc.role
                )
            ) FILTER (WHERE cu.id IS NOT NULL) AS collaborators,
            json_agg(
                json_build_object(
                    'id', t.id,
                    'title', t.title,
                    'year', t.year,
                    'genre', t.genre,
                    'duration_ms', t.duration_ms,
                    'path', t.path,
                    'cover_path', t.cover_path,
                    'is_explicit', t.is_explicit,
                    'play_count', t.play_count,
                    'position', pt.position,
                    'added_by', pt.added_by,
                    'added_at', pt.added_at,
                    'album_title', al.title,
                    'artists', (
                        SELECT json_agg(a.name)
                        FROM tracks_compositors tc
                        JOIN artists a ON tc.author_id = a.id
                        WHERE tc.track_id = t.id
                    )
                )
            ) FILTER (WHERE t.id IS NOT NULL) AS tracks
        FROM playlists p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN playlist_collaborators pc ON p.id = pc.playlist_id
        LEFT JOIN users cu ON pc.user_id = cu.id
        LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
        LEFT JOIN tracks t ON pt.track_id = t.id
        LEFT JOIN albums al ON t.album_id = al.id
        WHERE p.id = ANY($1)
        GROUP BY p.id, u.id
        ORDER BY p.id
    `, [ids]).then(r => r.rows);
}

async function savePlaylists(playlists) {
    const ids = [];

    for (const p of playlists) {
        const result = await db.query(`
            INSERT INTO playlists (
                owner_id,
                name,
                description
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (owner_id, name)
            DO UPDATE SET
                description = EXCLUDED.description,
                updated_at = NOW()
            RETURNING id;
        `, [
            p.owner_id,
            p.name,
            p.description,
        ]);

        const playlistId = result.rows[0].id;

        for (const track of (p.tracks || [])) {
            await db.query(`
                INSERT INTO playlist_tracks (playlist_id, track_id, added_by)
                VALUES ($1, $2, $3)
                ON CONFLICT DO NOTHING;
            `, [playlistId, track.id, p.owner_id]);
        }

        for (const collaborator of (p.collaborators || [])) {
            await db.query(`
                INSERT INTO playlist_collaborators (playlist_id, user_id, role)
                VALUES ($1, $2, $3)
                ON CONFLICT DO NOTHING;
            `, [playlistId, collaborator.id, collaborator.role ?? 'viewer']);
        }

        ids.push(playlistId);
    }

    return ids;
}

module.exports = { findPlaylists, savePlaylists, getPlaylists };