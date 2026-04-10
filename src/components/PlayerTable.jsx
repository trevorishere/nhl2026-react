import { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { BASE_DATA } from '../data/players';
import { CHALK_PICKS, ROUND1_MATCHUPS, ROUND_PROGRESSION } from '../data/constants';
import { getPosition } from '../data/positions';

// ─── Playoff factor by tier ────────────────────────────────────────────────────
function getPlayoffFactor(seasonPPG) {
  if (seasonPPG >= 0.95) return 0.975; // Superstar
  if (seasonPPG >= 0.56) return 0.90;  // Top 6
  return 0.825;                          // Depth
}

// ─── Expected games ────────────────────────────────────────────────────────────
// All teams play at least their R1 series. Each subsequent round is added only
// if the team was picked as winner of the prior round.
// Unpicked series fall back to CHALK_PICKS (Option A).
// Normal mode: 5.5 games per series. Advanced: user-selected (default 6).
function calcExpectedGames(team, effectivePicks, seriesLengths, mode) {
  const gamesFor = (id) => mode === 'advanced' ? (seriesLengths[id] ?? 6) : 6;
  const r1 = ROUND1_MATCHUPS.find((m) => m.teams.includes(team));
  if (!r1) return 0;
  let games = gamesFor(r1.id);
  let cur = r1.id;
  while (ROUND_PROGRESSION[cur] && effectivePicks[cur] === team) {
    cur = ROUND_PROGRESSION[cur];
    games += gamesFor(cur);
  }
  return games;
}

// ─── Table column definitions ──────────────────────────────────────────────────
const COLUMNS = [
  { key: '#',                    label: '#',          sortable: false, align: 'left'  },
  { key: 'name',                 label: 'Player',     sortable: true,  align: 'left'  },
  { key: 'team',                 label: 'Team',       sortable: true,  align: 'left'  },
  { key: 'pos',                  label: 'Pos',        sortable: true,  align: 'left'  },
  { key: 'dynamicPoints',        label: 'Proj Pts',   sortable: true,  align: 'right', defaultDir: 'desc' },
  { key: 'SeasonPPG',            label: 'Season PPG', sortable: false, align: 'right' },
  { key: 'dynamicExpectedGames', label: 'Exp. Games', sortable: false, align: 'right' },
];

export default function PlayerTable({ picks, mode, seriesLengths }) {
  const [sortConfig, setSortConfig] = useState({ key: 'dynamicPoints', direction: 'desc' });
  const [hoveredHeader, setHoveredHeader] = useState(null);

  function handleSort(col) {
    setSortConfig((prev) => {
      if (prev.key === col.key) {
        return { key: col.key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: col.key, direction: col.defaultDir ?? 'asc' };
    });
  }

  const rows = useMemo(() => {
    // Option A: user picks override chalk; chalk fills any unpicked series
    const effectivePicks = { ...CHALK_PICKS, ...picks };

    const computed = [...BASE_DATA].map((p) => {
      const pos = getPosition(p.name);
      const eg  = calcExpectedGames(p.team, effectivePicks, seriesLengths, mode);
      const pts = p.SeasonPPG * getPlayoffFactor(p.SeasonPPG) * eg;
      return { ...p, pos, dynamicExpectedGames: eg, dynamicPoints: pts };
    });

    computed.sort((a, b) => {
      const { key, direction } = sortConfig;
      const aVal = a[key];
      const bVal = b[key];
      const cmp  = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return direction === 'asc' ? cmp : -cmp;
    });

    return computed;
  }, [picks, mode, seriesLengths, sortConfig]);

  function SortArrow({ col }) {
    const isActive  = sortConfig.key === col.key;
    const isHovered = hoveredHeader === col.key;
    if (!isActive && !isHovered) return <span className="inline-block w-4" />;
    const Icon = isActive
      ? (sortConfig.direction === 'asc' ? ArrowUp : ArrowDown)
      : ((col.defaultDir ?? 'asc') === 'desc' ? ArrowDown : ArrowUp);
    return <Icon size={16} className={isActive ? 'text-primary' : 'text-muted'} />;
  }

  return (
    <>
      <p className="text-[13px] text-muted">
        Formula: Projected Points = Season PPG × Playoff Factor × Expected Games.
        Playoff factor: superstar (≥0.95 PPG) = 97.5%, top-6 (0.56–0.94) = 90%, depth (≤0.55) = 82.5%.
        Unpicked series use chalk projections.
        {mode === 'normal'
          ? ' Normal mode assumes 6 games per series.'
          : ' Advanced mode uses your per-series game picks (default 6).'}
      </p>
      <div className="h-3" />
      <div className="max-h-[50vh] overflow-auto border border-border rounded-xl max-w-4xl mx-auto">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const isActive  = sortConfig.key === col.key;
                const isHovered = hoveredHeader === col.key && col.sortable;
                const isRight   = col.align === 'right';
                return (
                  <th
                    key={col.key}
                    className={[
                      'px-2 py-2.5 border-b border-border text-[12px] uppercase tracking-[0.06em] sticky top-0 bg-surface font-semibold select-none',
                      isRight ? 'text-right' : 'text-left',
                      col.sortable ? 'cursor-pointer' : '',
                      isActive || isHovered ? 'text-primary' : 'text-muted',
                    ].join(' ')}
                    onClick={col.sortable ? () => handleSort(col) : undefined}
                    onMouseEnter={() => col.sortable && setHoveredHeader(col.key)}
                    onMouseLeave={() => setHoveredHeader(null)}
                  >
                    {isRight ? (
                      <div className="flex items-center justify-end gap-2">
                        {col.sortable && <SortArrow col={col} />}
                        <span>{col.label}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{col.label}</span>
                        {col.sortable && <SortArrow col={col} />}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={i} className="hover:bg-surface2 transition-colors">
                <td className="px-2 py-2.5 border-b border-border text-muted">{i + 1}</td>
                <td className="px-2 py-2.5 border-b border-border font-medium">{p.name}</td>
                <td className="px-2 py-2.5 border-b border-border text-muted">{p.team}</td>
                <td className="px-2 py-2.5 border-b border-border text-muted">{p.pos}</td>
                <td className="px-2 py-2.5 border-b border-border font-bold text-primary text-right">
                  {p.dynamicPoints.toFixed(1)}
                </td>
                <td className="px-2 py-2.5 border-b border-border text-right">{p.SeasonPPG.toFixed(2)}</td>
                <td className="px-2 py-2.5 border-b border-border text-muted text-right">{p.dynamicExpectedGames.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
