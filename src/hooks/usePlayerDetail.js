import { useState, useEffect } from 'react';
import { PLAYER_IDS } from '../data/playerIds';

const cache  = new Map(); // nhlId → { data, ts }
const TTL    = 5 * 60 * 1000; // 5 minutes
const SEASON = '20252026';

// In Vite dev (npm run dev) the local proxy handles CORS.
// In built/deployed files, route through corsproxy.io.
const NHL_BASE = import.meta.env.DEV
  ? '/nhl-api'
  : 'https://corsproxy.io/?https://api-web.nhle.com';

export function usePlayerDetail(player) {
  const [state, setState] = useState({ data: null, loading: false, error: null });

  useEffect(() => {
    if (!player) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const nhlId = PLAYER_IDS[`${player.name}|${player.team}`];
    if (!nhlId) {
      setState({ data: null, loading: false, error: 'no-id' });
      return;
    }

    const cached = cache.get(nhlId);
    if (cached && Date.now() - cached.ts < TTL) {
      setState({ data: cached.data, loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    Promise.all([
      fetch(`${NHL_BASE}/v1/player/${nhlId}/landing`).then((r) => {
        if (!r.ok) throw new Error(`landing ${r.status}`);
        return r.json();
      }),
      fetch(`${NHL_BASE}/v1/player/${nhlId}/game-log/${SEASON}/2`).then((r) => {
        if (!r.ok) throw new Error(`game-log ${r.status}`);
        return r.json();
      }),
    ])
      .then(([landing, log]) => {
        const data = { landing, log };
        cache.set(nhlId, { data, ts: Date.now() });
        setState({ data, loading: false, error: null });
      })
      .catch((err) => setState({ data: null, loading: false, error: err.message }));
  }, [player?.name, player?.team]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

// ── Helpers exported for use in the panel ─────────────────────────────────────

/** "21:34" → seconds */
export function toiToSeconds(toi = '0:00') {
  const [m, s] = toi.split(':').map(Number);
  return m * 60 + (s || 0);
}

/** seconds → "MM:SS" */
export function secondsToToi(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
