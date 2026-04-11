import { SEEDS, TEAM_STYLES } from '../data/constants';
import { LOGOS } from '../data/logos';

function teamBackground(team) {
  const s = TEAM_STYLES[team];
  if (!s) return '#1c1b19';
  if (!s.overlay) return s.bg;
  return `linear-gradient(rgba(0,0,0,${s.overlay}),rgba(0,0,0,${s.overlay})),linear-gradient(${s.bg},${s.bg})`;
}

export default function TeamButton({ team, matchId, picks, onPick }) {
  // Blank / TBD slot
  if (!team) {
    return (
      <div
        className="h-[58px] w-[156px] shrink-0 relative"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />
    );
  }

  const picked       = picks[matchId] || null;
  const isEliminated = !!(picked && picked !== team);

  const background = isEliminated ? 'rgba(255,255,255,0.05)' : teamBackground(team);
  const logoUri    = LOGOS[team] || '';

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onPick(matchId, team); }}
      className="h-[58px] w-[156px] shrink-0 relative overflow-hidden cursor-pointer p-0 border-0 block text-left"
      style={{ background }}
    >
      {/* Logo — right-anchored, bleeds above card */}
      {logoUri && (
        <img
          src={logoUri}
          alt={team}
          className="absolute block pointer-events-none"
          style={{
            left: 52,
            top: -28,
            width: 140,
            height: 93,
            objectFit: 'contain',
            ...(isEliminated && { opacity: 0.2, filter: 'grayscale(1)' }),
          }}
        />
      )}

      {/* Team abbr + seed — left-aligned */}
      <div
        className={`absolute inset-y-0 flex flex-col justify-center gap-[2px] whitespace-nowrap ${isEliminated ? 'opacity-30' : ''}`}
        style={{ left: 16 }}
      >
        <span
          className="text-white text-[16px] font-bold leading-normal"
          style={{ fontFamily: 'Figtree, sans-serif', letterSpacing: '0.48px' }}
        >
          {team}
        </span>
        <span
          className="text-[11px] font-semibold leading-normal"
          style={{ fontFamily: 'Figtree, sans-serif', letterSpacing: '0.33px', color: 'rgba(255,255,255,0.7)' }}
        >
          {SEEDS[team] || ''}
        </span>
      </div>
    </button>
  );
}
