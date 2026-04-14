import { useState } from 'react';
import { SEEDS, TEAM_STYLES } from '../data/constants';
import { LOGOS } from '../data/logos';

// Logo positions extracted exactly from Figma frame 123:29
const LOGO_POS = {
  COL: { left: 37,  top: -20,   width: 147, height: 98  },
  LAK: { left: 41,  top: -18,   width: 140, height: 93  },
  DAL: { left: 37,  top: -27,   width: 159, height: 106 },
  MIN: { left: 39,  top: -18,   width: 142, height: 95  },
  EDM: { left: 32,  top: -23,   width: 157, height: 105 },
  UTA: { left: 42,  top: -18,   width: 135, height: 90  },
  ANA: { left: 43,  top: -12,   width: 134, height: 89  },
  VGK: { left: 36,  top: -21,   width: 149, height: 99  },
  TBL: { left: 41,  top: -15,   width: 133, height: 89  },
  BOS: { left: 42,  top: -16,   width: 135, height: 90  },
  BUF: { left: 40,  top: -19,   width: 141, height: 94  },
  MTL: { left: 44,  top: -15,   width: 132, height: 88  },
  CAR: { left: 44,  top: -17,   width: 136, height: 91  },
  OTT: { left: 41,  top: -16,   width: 135, height: 90  },
  PIT: { left: 49,  top: -11,   width: 129, height: 86  },
  PHI: { left: 34,  top: -23,   width: 155, height: 103 },
};

// Per-team glow colour overrides; falls back to badge bg for unlisted teams
const GLOW_COLOR = {
  BOS: '#FFD700',
  PIT: '#FFD700',
  LAK: '#A2AAAD',
  MIN: '#FF1235',
  OTT: '#FF2649',
  VGK: '#B9975B',
  BUF: '#FFB81C',
  TBL: '#2185FF',
  EDM: '#FF886E',
  ANA: '#FF886E',
  COL: '#44A9F9',
  DAL: '#00E96C',
  CAR: '#FF233F',
  MTL: '#FF233F',
};

// Convert hex OR rgb() colour string → rgba(r,g,b,alpha)
function toRgba(color, alpha) {
  const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  const h = color.replace('#', '');
  const full = h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function teamBackground(team) {
  const s = TEAM_STYLES[team];
  if (!s) return '#1c1b19';
  if (!s.overlay) return s.bg;
  return `linear-gradient(rgba(0,0,0,${s.overlay}),rgba(0,0,0,${s.overlay})),linear-gradient(${s.bg},${s.bg})`;
}

const TRANSITION = 'opacity 0.25s ease-in-out, filter 0.25s ease-in-out';
const LOGO_TRANSITION = 'filter 0.25s ease-in-out';

export default function TeamButton({ team, matchId, picks, onPick }) {
  const [bursting, setBursting] = useState(false);
  const [hovering, setHovering] = useState(false);

  // Blank / TBD slot
  if (!team) {
    return (
      <div
        className="h-[58px] w-[156px] shrink-0 relative"
        style={{ background: 'rgba(255,255,255,0.05)', opacity: 0.5 }}
      />
    );
  }

  const picked       = picks[matchId] || null;
  const isWinner     = picked === team;
  const isEliminated = !!(picked && picked !== team);
  const isNonSelected = isEliminated || (!isWinner && !isEliminated); // default + eliminated

  const baseColor     = TEAM_STYLES[team]?.bg ?? '#333';
  const darkerColor   = `color-mix(in srgb, ${baseColor} 95%, black 5%)`;
  const brighterColor = `color-mix(in srgb, ${baseColor} 85%, white 15%)`;

  const glowSrc    = GLOW_COLOR[team] ?? baseColor;
  const glowBright = toRgba(glowSrc, 0.85);
  const glowDim    = toRgba(glowSrc, 0.40);

  // ── Button style ─────────────────────────────────────────────────────────
  let buttonStyle;
  if (isWinner) {
    buttonStyle = {
      background: `linear-gradient(8deg, ${darkerColor}, ${brighterColor}, ${darkerColor})`,
      animation: bursting
        ? 'teamGlowBurst 0.85s ease-out forwards'
        : 'teamPulseGlow 2s ease-in-out infinite',
      '--glow-bright': glowBright,
      '--glow-dim':    glowDim,
    };
  } else if (isEliminated) {
    // Eliminated: 50% opacity, restores colour + opacity on hover
    buttonStyle = {
      background:  hovering ? teamBackground(team) : 'rgba(255,255,255,0.05)',
      opacity:     hovering ? 1 : 0.5,
      transition:  TRANSITION,
      '--glow-bright': glowBright,
    };
  } else {
    // Default (no pick made): full opacity, no animation
    buttonStyle = {
      background:      teamBackground(team),
      '--glow-bright': glowBright,
    };
  }

  // ── Logo style ───────────────────────────────────────────────────────────
  let logoFilter;
  if (isWinner) {
    logoFilter = 'drop-shadow(0 0 4px rgba(255,255,255,0.7))';
  } else if (hovering) {
    // Hover: full colour + glow (also de-greys eliminated logos)
    logoFilter = 'drop-shadow(0 0 4px rgba(255,255,255,0.7))';
  } else if (isEliminated) {
    logoFilter = 'grayscale(1)';
  } else {
    logoFilter = 'drop-shadow(0 0 1px rgba(255,255,255,0))';
  }

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
      onMouseEnter={() => { if (isNonSelected) setHovering(true); }}
      onMouseLeave={() => setHovering(false)}
      onAnimationEnd={(e) => { if (e.animationName === 'teamGlowBurst') setBursting(false); }}
      className="h-[58px] w-[156px] shrink-0 relative overflow-hidden cursor-pointer p-0 border-0 block text-left"
      style={buttonStyle}
    >
      {logoUri && (
        <img
          src={logoUri}
          alt={team}
          className="absolute block pointer-events-none"
          style={{
            left:       logoPos.left,
            top:        logoPos.top,
            width:      logoPos.width,
            height:     logoPos.height,
            objectFit:  'contain',
            filter:     logoFilter,
            transition: isNonSelected ? LOGO_TRANSITION : undefined,
          }}
        />
      )}

      <div
        className="absolute inset-y-0 flex flex-col justify-center gap-[2px] whitespace-nowrap"
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
