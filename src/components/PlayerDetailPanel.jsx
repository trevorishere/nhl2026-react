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

// Section label: 13px Bold uppercase #5c5a56
const sectionLabel = {
  fontFamily: FF, fontSize: 13, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.65px',
  color: '#5c5a56', lineHeight: '19px', whiteSpace: 'nowrap',
};

// ── Main panel ────────────────────────────────────────────────────────────────
export default function PlayerDetailPanel({ player, injuries = {}, onClose, contentVisible = true }) {
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
      background: '#262829',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Content — fades on player switch ───────────────────────────────── */}
      <div style={{
        opacity:    contentVisible ? 1 : 0,
        transition: 'opacity 150ms ease-in-out',
      }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: headerBg,
        height: 120,
        padding: 16,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
      }}>
        {/* Inner row: left group + close button */}
        <div style={{
          display: 'flex',
          flex: '1 0 0',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          width: '100%',
        }}>

          {/* Left: headshot + name/pos, vertically centered in full row height */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', height: '100%' }}>

            {/* Circular headshot */}
            <div style={{
              width: 83, height: 83, flexShrink: 0,
              borderRadius: 60, overflow: 'hidden',
              position: 'relative',
              boxShadow: '0px 0px 10.879px 0px rgba(0,0,0,0.1)',
            }}>
              {headshot ? (
                <img
                  src={headshot}
                  alt={player.name}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FF, fontSize: 22, fontWeight: 800,
                  color: 'rgba(255,255,255,0.4)',
                }}>
                  {player.name[0]}
                </div>
              )}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 60,
              }} />
            </div>

            {/* Name + TEAM | POS */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, minWidth: 0 }}>
              <div style={{
                fontFamily: FF, fontSize: 20, fontWeight: 700,
                color: '#e7e4df', letterSpacing: '0.2px', lineHeight: '22px',
              }}>
                {player.name}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{
                  fontFamily: FF, fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                  color: 'rgba(231,228,223,0.7)', lineHeight: '19px',
                }}>{player.team}</span>
                <span style={{ fontFamily: FF, fontSize: 12, color: 'rgba(231,228,223,0.7)', letterSpacing: '0.6px' }}>|</span>
                <span style={{
                  fontFamily: FF, fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                  color: 'rgba(231,228,223,0.7)', lineHeight: '19px',
                }}>{player.pos}</span>
              </div>
            </div>
          </div>

          {/* Close button — top-right */}
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, flexShrink: 0,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.1)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(231,228,223,0.7)',
            }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>

        {/* Injury card */}
        {inj && (
          <div style={{
            background: C.injBg, border: `1px solid ${C.injBorder}`,
            borderRadius: 4, padding: '12px 16px 16px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ ...T.label, color: C.injLabel }}>
                {inj.type}{inj.date ? ` (${inj.date})` : ''}
              </span>
              <AlertCircle size={18} color={C.injLabel} style={{ flexShrink: 0 }} />
            </div>
            <p style={{
              fontFamily: FF, fontSize: 13, fontWeight: 400,
              color: C.text, letterSpacing: '0.26px', lineHeight: '19px', margin: 0,
            }}>
              {inj.note}
            </p>
          </div>
        )}

        {/* Playoffs + Season wrapper */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── 2025-26 PLAYOFFS ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, paddingBottom: 12 }}>
            <span style={sectionLabel}>2025-26 Playoffs</span>
            <div style={{ paddingTop: 4, paddingBottom: 4 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: C.accent }}>
                <span style={{
                  fontFamily: FF, fontSize: 32, fontWeight: 700,
                  letterSpacing: '1.6px', lineHeight: '21px',
                }}>
                  {player.dynamicPoints != null ? Math.round(player.dynamicPoints) : '—'}
                </span>
                <span style={{
                  fontFamily: FF, fontSize: 10, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '14px',
                }}>
                  Projected<br />points
                </span>
              </div>
            </div>
          </div>

          {/* ── 2025-26 SEASON ────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12, paddingBottom: 16 }}>
            <span style={sectionLabel}>2025-26 Season</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Powerplay Pts + Points over last 10 */}
              <div style={{ display: 'flex', gap: 40, alignItems: 'center', paddingTop: 4, paddingBottom: 4 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {loading
                    ? <Skeleton width={28} height={21} />
                    : <span style={{ fontFamily: FF, fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: '1.2px', lineHeight: '21px' }}>
                        {ppPoints !== null ? ppPoints : '—'}
                      </span>
                  }
                  <span style={{ fontFamily: FF, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: C.muted, lineHeight: '14px' }}>
                    Powerplay<br />points
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {loading
                    ? <Skeleton width={22} height={21} />
                    : <span style={{ fontFamily: FF, fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: '1.2px', lineHeight: '21px' }}>
                        {last10pts !== null ? last10pts : '—'}
                      </span>
                  }
                  <span style={{ fontFamily: FF, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: C.muted, lineHeight: '14px' }}>
                    Points over<br />last 10 games
                  </span>
                </div>
              </div>

              {/* Goals / Assists / Points / Avg TOI */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 4, paddingBottom: 4, textAlign: 'center' }}>
                {[
                  { label: 'Goals',   value: player.goals },
                  { label: 'Assists', value: player.assists },
                  { label: 'Points',  value: player.points },
                  { label: 'Avg TOI', value: loading ? null : (avgToi ?? '—'), isLoading: loading },
                ].map(({ label, value, isLoading }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                    {isLoading
                      ? <Skeleton width={36} height={21} />
                      : <span style={{ fontFamily: FF, fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '0.8px', lineHeight: '21px' }}>
                          {value ?? '—'}
                        </span>
                    }
                    <span style={{ fontFamily: FF, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: C.muted, lineHeight: '15px' }}>
                      {label}
                    </span>
                  </div>
                ))}
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
      {/* ── end content fade wrapper ─────────────────────────────────────────── */}
      </div>
    </div>
  );
}
