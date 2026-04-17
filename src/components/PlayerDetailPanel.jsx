import { AlertCircle, X } from 'lucide-react';
import { usePlayerDetail, toiToSeconds, secondsToToi } from '../hooks/usePlayerDetail';
import { TEAM_STYLES } from '../data/constants';
import { FF, C, T } from '../styles/tokens';

function normalizeName(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function Skeleton({ width, height }) {
  return (
    <div
      className="animate-pulse rounded"
      style={{ width, height, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}
    />
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function PlayerDetailPanel({ player, injuries = {}, onClose }) {
  const { data, loading, error } = usePlayerDetail(player);
  const inj = injuries[normalizeName(player.name)] ?? null;

  const teamStyle = TEAM_STYLES[player.team] ?? { bg: '#333' };
  const headshot  = data?.landing?.headshot;

  // Derived stats from API
  let avgToi    = null;
  let ppPoints  = null;
  let last10pts = null;

  if (data) {
    const games  = data.log?.gameLog ?? [];
    const last10 = games.slice(-10);

    if (last10.length > 0) {
      const avgSec = last10.reduce((sum, g) => sum + toiToSeconds(g.toi), 0) / last10.length;
      avgToi    = secondsToToi(avgSec);
      last10pts = last10.reduce((sum, g) => sum + (g.goals ?? 0) + (g.assists ?? 0), 0);
    }

    const sub = data.landing?.featuredStats?.regularSeason?.subSeason;
    ppPoints = sub?.powerPlayPoints ?? null;
  }

  const headerBg = teamStyle.overlay
    ? `linear-gradient(rgba(0,0,0,${teamStyle.overlay}),rgba(0,0,0,${teamStyle.overlay})),linear-gradient(${teamStyle.bg},${teamStyle.bg})`
    : teamStyle.bg;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: headerBg, padding: 16, position: 'relative', flexShrink: 0 }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.textMuted, padding: 2, lineHeight: 1,
          }}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* Headshot — 63×63 circle */}
          <div style={{
            width: 63, height: 63, borderRadius: '50%',
            overflow: 'hidden', background: 'rgba(255,255,255,0.15)',
            flexShrink: 0,
          }}>
            {headshot ? (
              <img src={headshot} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : loading ? (
              <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FF, fontSize: 22, fontWeight: 800,
                color: 'rgba(255,255,255,0.4)',
              }}>
                {player.name[0]}
              </div>
            )}
          </div>

          {/* Name + TEAM | POS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ fontFamily: FF, fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '0.16px', lineHeight: '25px' }}>
              {player.name}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.65px', color: C.textMuted, lineHeight: '19px' }}>
                {player.team}
              </span>
              <span style={{ fontFamily: FF, fontSize: 16, letterSpacing: '0.8px', color: C.textMuted }}>|</span>
              <span style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.65px', color: C.textMuted, lineHeight: '19px' }}>
                {player.pos}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>

        {/* Injury card */}
        {inj && (
          <div style={{
            background: C.injBg, border: `1px solid ${C.injBorder}`,
            borderRadius: 4, padding: '12px 16px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ ...T.label, color: C.injLabel }}>
                {inj.type}{inj.date ? ` (${inj.date})` : ''}
              </span>
              <AlertCircle size={18} color={C.injLabel} style={{ flexShrink: 0 }} />
            </div>
            <p style={{ fontFamily: FF, fontSize: 14, fontWeight: 400, color: C.text, letterSpacing: '0.28px', lineHeight: '20px', margin: 0 }}>
              {inj.note}
            </p>
          </div>
        )}

        {/* ── 2025-26 PLAYOFFS ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={T.label}>2025-26 Playoffs</span>
          <div style={{ borderTop: `2px solid ${C.border}`, paddingTop: 12, paddingBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
              <span style={{ ...T.statLg, color: C.accent }}>
                {player.dynamicPoints != null ? Math.round(player.dynamicPoints) : '—'}
              </span>
              <span style={{ ...T.subLabel, color: C.accent }}>
                Projected<br />points
              </span>
            </div>
          </div>
        </div>

        {/* ── 2025-26 SEASON ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={T.label}>2025-26 Season</span>
          <div style={{ borderTop: `2px solid ${C.border}`, paddingTop: 12, paddingBottom: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Goals / Assists / Points / Avg TOI */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', textAlign: 'center' }}>
              {[
                { label: 'Goals',   value: player.goals },
                { label: 'Assists', value: player.assists },
                { label: 'Points',  value: player.points },
                { label: 'Avg TOI', value: loading ? null : (avgToi ?? '—'), loading },
              ].map(({ label, value, loading: isLoading }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                  {isLoading ? <Skeleton width={36} height={21} /> : <span style={T.statSm}>{value ?? '—'}</span>}
                  <span style={T.subLabel}>{label}</span>
                </div>
              ))}
            </div>

            {/* Powerplay Pts + Points over last 10 */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {loading ? <Skeleton width={28} height={21} /> : <span style={T.statMd}>{ppPoints !== null ? ppPoints : '—'}</span>}
                <span style={T.subLabel}>Powerplay<br />points</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {loading ? <Skeleton width={22} height={21} /> : <span style={T.statMd}>{last10pts !== null ? last10pts : '—'}</span>}
                <span style={T.subLabel}>Points over<br />last 10 games</span>
              </div>
            </div>

          </div>
        </div>

        {/* Error states */}
        {error && error !== 'no-id' && (
          <p style={{ fontFamily: FF, fontSize: 11, color: C.muted, textAlign: 'center', margin: 0 }}>
            Live stats unavailable
          </p>
        )}
        {error === 'no-id' && (
          <p style={{ fontFamily: FF, fontSize: 11, color: C.muted, textAlign: 'center', margin: 0 }}>
            Live stats not mapped for this player
          </p>
        )}

      </div>
    </div>
  );
}
