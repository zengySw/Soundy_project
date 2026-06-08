var express = require('express');
const db = require('../config/db');
const { mapPlaylist, rankTracks, mapDeezerTrack, mapJamendoTrack, mapAudiusTrack } = require('../utils/dataMaps');

async function outSearchMp3(q, limit = 20) {

    console.log('!!!');

    const candidates = [];

    // =========================
    // 1. AUDIUS
    // =========================
    try {
        const res = await fetch(`https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}`);
        const json = await res.json();

        for (const t of json.data || []) {
            if (t?.stream?.url) {
                candidates.push({
                    source: "audius",
                    id: t.id,
                    title: t.title,
                    artist: t.user?.name || "Unknown",
                    artwork: t.artwork?.["480x480"] || "",
                    stream: t.stream.url,
                    mirrors: t.stream.mirrors || []
                });
            }
        }
    } catch (e) {
        console.warn("[Audius error]", e.message);
    }

    // =========================
    // 2. JAMENDO
    // =========================
    try {
        const res = await fetch(
            `https://api.jamendo.com/v3.0/tracks/?client_id=${process.env.JAMENDO_ID}` +
            `&format=json&limit=10&namesearch=${encodeURIComponent(q)}&audioformat=mp32`
        );

        const json = await res.json();

        for (const t of json.results || []) {
            if (t?.audio) {
                candidates.push({
                    source: "jamendo",
                    id: t.id,
                    title: t.name,
                    artist: t.artist_name || "Unknown",
                    artwork: t.album_image || t.image || "",
                    stream: t.audio
                });
            }
        }
    } catch (e) {
        console.warn("[Jamendo error]", e.message);
    }

    // =========================
    // 3. DEEZER
    // =========================
    try {
        const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();

        for (const t of json.data || []) {
            if (t?.preview) {
                candidates.push({
                    source: "deezer",
                    id: t.id,
                    title: t.title,
                    artist: t.artist?.name || "Unknown",
                    artwork: t.album?.cover_medium || "",
                    stream: t.preview
                });
            }
        }
    } catch (e) {
        console.warn("[Deezer error]", e.message);
    }

    // =========================
    // 4. RESOLVE MP3 + NORMALIZE
    // =========================
    const results = [];

    for (const track of candidates) {

        let mp3 = null;

        try {
            if (track.source === "audius") {
                mp3 = await tryStreamUrl(
                    track.stream,
                    track.mirrors || []
                );
            } else {
                mp3 = track.stream;
            }
        } catch {
            mp3 = null;
        }

        if (!mp3) continue;

        results.push({
            id: `${track.source}:${track.id}`, // ⚡ важно для уникальности
            title: track.title,
            artist: track.artist,
            artwork: track.artwork,
            mp3,
            source: track.source,
            rank: 0 // под Fuse / rankTracks
        });

        if (results.length >= limit) break;
    }

    return results;
}

const tryStreamUrl = async (base_url, mirrors = []) => {
    // Извлекаем путь из основного URL и подставляем в каждую ноду
    const url = new URL(base_url);
    const path = url.pathname + url.search;

    const all_nodes = [base_url, ...mirrors.map(m => m + path)];

    for (const node_url of all_nodes) {
        try {
            const res = await fetch(node_url, { method: "HEAD" });
            if (res.ok || res.status === 206) return node_url;
        } catch {
            // нода недоступна, пробуем следующую
        }
    }

    return null; // все ноды упали
};

async function outSearch(q) {
    const results = [];

    // ===== Deezer =====
    try {
        const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();

        for (const item of json.data || []) {
            results.push(mapDeezerTrack(item));
        }
    } catch (e) {
        console.warn("Deezer failed:", e.message);
    }

    // ===== Jamendo =====
    try {
        const res = await fetch(
            `https://api.jamendo.com/v3.0/tracks/?client_id=${process.env.JAMENDO_ID}` +
            `&format=json&limit=10&namesearch=${encodeURIComponent(q)}`
        );

        const json = await res.json();

        for (const item of json.results || []) {
            results.push(mapJamendoTrack(item));
        }
    } catch (e) {
        console.warn("Jamendo failed:", e.message);
    }

    // ===== Audius =====
    try {
        const res = await fetch(
            `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}`
        );

        const json = await res.json();

        for (const item of json.data || []) {
            results.push(mapAudiusTrack(item));
        }
    } catch (e) {
        console.warn("Audius failed:", e.message);
    }

    return rankTracks(results, q);
}

// async function getPlaylistTracks(playlistId, query) {

//     const existing = await db.query(`
//         SELECT track_id
//         FROM playlist_tracks
//         WHERE playlist_id = $1
//     `, [playlistId]);

//     let ids = existing.rows.map(r => r.track_id);

//     // fallback enrichment
//     if (ids.length < 10) {
//         const newIds = await fillPlaylist(playlistId, query);
//         ids = [...ids, ...newIds];
//     }

//     // ALWAYS return full tracks
//     const result = await db.query(`
//         SELECT 
//             t.id,
//             t.title,
//             t.cover_path,
//             a.name AS artist_name
//         FROM tracks t
//         LEFT JOIN tracks_compositors tc ON t.id = tc.track_id
//         LEFT JOIN artists a ON tc.author_id = a.id
//         WHERE t.id = ANY($1::uuid[])
//     `, [ids]);

//     return result.rows;
// }

// async function outSearchPlaylists(query) {

//     // Deezer playlists
//     const res = await fetch(`https://api.deezer.com/search/playlist?q=${query}`);
//     const json = await res.json();

//     await fillPlaylist(mapPlaylist(json.data[0]));

//     return results;
// }

module.exports = { outSearch, outSearchMp3 };