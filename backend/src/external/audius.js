const API = 'https://api.audius.co/v1';
async function searchAudiusTracks(q, limit = 20) {
    const res = await fetch(
        `${API}/tracks/search?query=${encodeURIComponent(q)}&limit=${limit}`
    );
    const json = await res.json();
    return json.data || [];
}

async function searchAudiusMp3(q, candidates) {
    try {
        const res = await fetch(
            `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}`
        );

        const json = await res.json();

        for (const t of json.data || []) {
            if (!t?.stream?.url) continue;

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

    } catch (e) {
        console.warn("[Audius error]", e.message);
    }
}

module.exports = { searchAudiusTracks, searchAudiusMp3 };