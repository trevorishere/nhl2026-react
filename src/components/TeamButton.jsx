import { useState } from 'react';
import { SEEDS, TEAM_STYLES } from '../data/constants';
import { LOGOS } from '../data/logos';

// Per-team logo position extracted from Figma design.
// Each team's logo has its own natural proportions and is anchored to the
// right side of the 156×58px card, intentionally bleeding above the top edge.
const LOGO_POS = {
  ANA: { left: 40, top: -22, width: 153, height: 99 },
  BOS: { left: 48, top: -19, width: 144, height: 96 },
  BUF: { left: 50, top: -20, width: 145, height: 95 },
  CAR: { left: 59, top: -24, width: 136, height: 91 },
  COL: { left: 52, top: -28, width: 140, height: 93 },
  DAL: { left: 45, top: -24, width: 156, height: 103 },
  EDM: { left: 35, top: -23, width: 159, height: 105 },
  LAK: { left: 50, top: -17, width: 138, height: 92 },
  MIN: { left: 39, top: -22, width: 147, height: 98 },
  MTL: { left: 55, top: -18, width: 135, height: 88 },
  OTT: { left: 48, top: -14, width: 132, height: 87 },
  PHI: { left: 59, top: -12, width: 131, height: 87 },
  PIT: { left: 54, top: -12, width: 130, height: 86 },
  TBL: { left: 56, top: -22, width: 129, height: 85 },
  UTA: { left: 54, top: -16, width: 132, height: 87 },
  VGK: { left: 37, top: -27, width: 150, height: 99 },
};

function teamBackground(team) {
  const s = TEAM_STYLES[team];
  if (!s) return '#1c1b19';
  if (!s.overlay) return s.bg;
  return `linear-gradient(rgba(0,0,0,${s.overlay}),rgba(0,0,0,${s.overlay})),linear-gradient(${s.bg},${s.bg})`;
}

export default function TeamButton({ team, matchId, picks, onPick }) {
  const [bursting, setBursting] = useState(false);

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
  const isWinner     = picked === team;
  const isEliminated = !!(picked && picked !== team);

  const baseColor   = TEAM_STYLES[team]?.bg ?? '#333';
  const brightColor = `color-mix(in srgb, ${baseColor} 95%, white 5%)`;

  // Selected badge: animated gradient; bursting = click burst overrides the shimmer
  const buttonStyle = isWinner
    ? {
        background: `linear-gradient(8deg, ${baseColor}, ${brightColor}, ${baseColor})`,
        backgroundSize: '200% 200%',
        animation: bursting
          ? 'teamGlowBurst 0.55s ease-out forwards'
          : 'teamGradientShift 3s ease-in-out infinite',
        boxShadow: bursting ? undefined : '0 0 10px 3px rgba(255, 248, 210, 0.18)',
      }
    : isEliminated
    ? { background: 'rgba(255,255,255,0.05)' }
    : { background: teamBackground(team) };

  const logoUri = LOGOS[team] || '';
  const logoPos = LOGO_POS[team] ?? { left: 50, top: -20, width: 140, height: 93 };

  const handleClick = (e) => {
    e.stopPropagation();
    onPick(matchId, team);
    setBursting(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onAnimationEnd={() => setBursting(false)}
      className="h-[58px] w-[156px] shrink-0 relative overflow-hidden cursor-pointer p-0 border-0 block text-left"
      style={buttonStyle}
    >
      {/* Logo — per-team position from Figma, bleeds above and right */}
      {logoUri && (
        <img
          src={logoUri}
          alt={team}
          className="absolute block pointer-events-none"
          style={{
            left: logoPos.left,
            top: logoPos.top,
            width: logoPos.width,
            height: logoPos.height,
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
