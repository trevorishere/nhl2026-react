import { Check } from 'lucide-react';
import { SEEDS, TEAM_STYLES } from '../data/constants';
import { LOGOS } from '../data/logos';

function teamBackground(team) {
  const s = TEAM_STYLES[team];
  if (!s) return '#1c1b19';
  if (!s.overlay) return s.bg;
  return `linear-gradient(rgba(0,0,0,${s.overlay}),rgba(0,0,0,${s.overlay})),linear-gradient(${s.bg},${s.bg})`;
}

export default function TeamButton({ team, matchId, isFirst, picks, onPick }) {
  // Blank / TBD slot
  if (!team) {
    return (
      <div
        className="h-[58px] w-[128px] shrink-0 relative"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />
    );
  }

  const picked  = picks[matchId] || null;
  const isWinner     = picked === team;
  const isEliminated = !!(picked && picked !== team);

  const background = isEliminated
    ? 'rgba(255,255,255,0.05)'
    : teamBackground(team);

  const logoUri = LOGOS[team] || '';

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onPick(matchId, team); }}
      className="h-[58px] w-[128px] shrink-0 relative overflow-hidden cursor-pointer p-0 border-0 block text-left"
      style={{ background }}
    >
      {/* Logo — bleeds in from left edge */}
      {logoUri && (
        <img
          src={logoUri}
          alt={team}
          className={`absolute block pointer-events-none ${isEliminated ? 'opacity-25' : ''}`}
          style={{ left: -23, top: 1, width: 84, height: 56, objectFit: 'contain', ...(isEliminated && { filter: 'grayscale(1)' }) }}
        />
      )}

      {/* Abbr + Seed text */}
      <div
        className={`absolute inset-y-0 flex flex-col justify-center gap-[2px] whitespace-nowrap ${isEliminated ? 'opacity-25' : ''}`}
        style={{ left: 56 }}
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

      {/* Checkmark for winner */}
      {isWinner && (
        <div
          className="absolute flex items-center justify-center"
          style={{ left: 98, top: 9, width: 18, height: 18 }}
        >
          <Check
            size={16}
            strokeWidth={3}
            strokeLinecap="square"
            strokeLinejoin="miter"
            color="white"
          />
        </div>
      )}
    </button>
  );
}
