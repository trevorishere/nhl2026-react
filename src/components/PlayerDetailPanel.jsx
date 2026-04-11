import { X } from 'lucide-react';
import { usePlayerDetail, toiToSeconds, secondsToToi } from '../hooks/usePlayerDetail';
import { TEAM_STYLES } from '../data/constants';

const CHIPS = [
  'Which line is this player on?',
  'PP1 or PP2?',
  'Any known injuries?',
  'Deployment changed recently?',
  'Facing a shutdown matchup?',
];

// ── Skeleton block for loading state ─────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-surface2 ${className}`} />;
}

// ── Single stat cell ──────────────────────────────────────────────────────────
function StatCell({ label, value, highlight }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-[17px] font-bold ${highlight ? 'text-primary' : 'text-app-text'}`}>
        {value ?? '—'}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-muted">{label}</span>
    </div>
  );
}

// ── Form dot ─────────────────────────────────────────────────────────────────
function FormDot({ pts, date }) {
  const colour =
    pts >= 2 ? 'bg-primary'
    : pts === 1 ? 'bg-primary opacity-50'
    : 'bg-border';

  return (
    <div className="relative group">
      <div className={`w-3 h-3 rounded-full ${colour}`} />
      {/* Tooltip */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-surface border border-border rounded-lg px-2 py-1 text-[11px] whitespace-nowrap shadow-card opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {date} · {pts} pt{pts !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function PlayerDetailPanel({ player, onClose }) {
  const { data, loading, error } = usePlayerDetail(player);

  const teamStyle  = TEAM_STYLES[player.team] ?? { bg: '#333', overlay: 0 };
  const headshot   = data?.landing?.headshot;

  // Derive API stats once data is loaded
  let avgToi   = null;
  let ppPoints = null;
  let recentGames = [];

  if (data) {
    const games = data.log?.gameLog ?? [];
    const last10 = games.slice(-10);

    if (last10.length > 0) {
      const avgSec = last10.reduce((sum, g) => sum + toiToSeconds(g.toi), 0) / last10.length;
      avgToi = secondsToToi(avgSec);

      recentGames = last10.map((g) => ({
        pts:  (g.goals ?? 0) + (g.assists ?? 0),
        date: g.gameDate ?? '',
      }));
    }

    const sub = data.landing?.featuredStats?.regularSeason?.subSeason;
    ppPoints = sub?.powerPlayPoints ?? null;
  }

  return (
    <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden flex flex-col">
      {/* ── Header: team colour + headshot + name ── */}
      <div
        className="relative flex items-end gap-3 px-4 pt-4 pb-3"
        style={{ background: teamStyle.bg }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Headshot */}
        <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
          {headshot ? (
            <img src={headshot} alt={player.name} className="w-full h-full object-cover" />
          ) : loading ? (
            <Skeleton className="w-full h-full rounded-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-2xl font-bold">
              {player.name[0]}
            </div>
          )}
        </div>

        {/* Name + meta */}
        <div className="pb-1 min-w-0">
          <div className="text-white font-bold text-[15px] leading-tight truncate pr-6">
            {player.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
              {player.pos}
            </span>
            <span className="text-white/70 text-[12px] font-medium">{player.team}</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col gap-4 p-4">

        {/* Quick stats — always shown (from existing data) */}
        <div className="grid grid-cols-4 gap-2 bg-surface2 rounded-xl p-3">
          <StatCell label="Goals"    value={player.goals} />
          <StatCell label="Assists"  value={player.assists} />
          <StatCell label="Points"   value={player.points} />
          <StatCell label="Proj Pts" value={player.dynamicPoints?.toFixed(1)} highlight />
        </div>

        {/* API stats */}
        <div className="grid grid-cols-2 gap-2">
          {/* Avg TOI */}
          <div className="bg-surface2 rounded-xl p-3 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-muted">Avg TOI</span>
            {loading ? (
              <Skeleton className="h-5 w-16 mt-1" />
            ) : (
              <span className="text-[15px] font-bold text-app-text">{avgToi ?? '—'}</span>
            )}
          </div>

          {/* PP Points */}
          <div className="bg-surface2 rounded-xl p-3 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-muted">PP Pts</span>
            {loading ? (
              <Skeleton className="h-5 w-10 mt-1" />
            ) : (
              <span className="text-[15px] font-bold text-app-text">
                {ppPoints !== null ? ppPoints : '—'}
              </span>
            )}
          </div>
        </div>

        {/* Recent form */}
        <div>
          <span className="text-[10px] uppercase tracking-widest text-muted block mb-2">
            Recent form (last 10 games)
          </span>
          {loading ? (
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="w-3 h-3 rounded-full" />
              ))}
            </div>
          ) : recentGames.length > 0 ? (
            <div className="flex gap-1.5">
              {recentGames.map((g, i) => (
                <FormDot key={i} pts={g.pts} date={g.date} />
              ))}
            </div>
          ) : (
            <span className="text-[12px] text-muted">No recent game data</span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Question chips */}
        <div>
          <span className="text-[10px] uppercase tracking-widest text-muted block mb-2">
            Things to check
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CHIPS.map((chip) => (
              <span
                key={chip}
                className="text-[11px] text-muted border border-border rounded-full px-2.5 py-1 leading-tight"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Error / no-id state */}
        {error && error !== 'no-id' && (
          <p className="text-[11px] text-muted text-center">Live stats unavailable</p>
        )}
        {error === 'no-id' && (
          <p className="text-[11px] text-muted text-center">Live stats not mapped for this player</p>
        )}
      </div>
    </div>
  );
}
