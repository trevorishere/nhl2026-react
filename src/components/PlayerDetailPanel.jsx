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
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: headerBg,
        paddingLeft: 8, paddingRight: 16, paddingTop: 16, paddingBottom: 0,
        position: 'relative',
        flexShrink: 0,
      }}>
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

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          {/* Headshot — 88×64 rectangle */}
          <div style={{
            width: 88, height: 64, flexShrink: 0,
            overflow: 'hidden',
            boxShadow: '0px 0px 10.879px 0px rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.15)',
          }}>
            {headshot ? (
              <img
                src={headshot}
                alt={player.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
              />
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
          <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 10 }}>
            <div style={{
              fontFamily: FF, fontSize: 16, fontWeight: 800,
              color: C.text, letterSpacing: '0.16px', lineHeight: '25px',
            }}>
              {player.name}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                fontFamily: FF, fontSize: 13, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.65px',
                color: C.textMuted, lineHeight: '19px',
              }}>
                {player.team}
              </span>
              <span style={{ fontFamily: FF, fontSize: 12, letterSpacing: '0.6px', color: C.textMuted }}>|</span>
              <span style={{
                fontFamily: FF, fontSize: 13, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.65px',
                color: C.textMuted, lineHeight: '19px',
              }}>
                {player.pos}
              </span>
            </div>
          </div>
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
    </div>
  );
}
