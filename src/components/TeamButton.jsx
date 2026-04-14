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

// Teams whose glow uses yellow instead of their badge colour
const YELLOW_GLOW = new Set(['BOS', 'PIT']);

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

const HOVER_TRANSITION = 'box-shadow 0.25s ease-in-out';
const LOGO_TRANSITION  = 'filter 0.25s ease-in-out';

export default function TeamButton({ team, matchId, picks, onPick }) {
  const [bursting, setBursting]   = useState(false);
  const [hovering, setHovering]   = useState(false);

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
  const isDefault    = !isWinner && !isEliminated;

  const baseColor    = TEAM_STYLES[team]?.bg ?? '#333';
  const darkerColor  = `color-mix(in srgb, ${baseColor} 95%, black 5%)`;
  const brighterColor = `color-mix(in srgb, ${baseColor} 85%, white 15%)`;

  const glowSrc    = YELLOW_GLOW.has(team) ? '#FFD700' : baseColor;
  const glowBright = toRgba(glowSrc, 0.85);
  const glowDim    = toRgba(glowSrc, 0.50);

  // Button styles per state
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
    buttonStyle = { background: 'rgba(255,255,255,0.05)' };
  } else {
    buttonStyle = {
      background:      teamBackground(team),
      '--glow-bright': glowBright,
    };
  }

  // Logo filter per state
  let logoFilter, logoTransition;
  if (isEliminated) {
    logoFilter = 'grayscale(1)';
  } else if (isWinner) {
    logoFilter = 'drop-shadow(0 0 4px rgba(255,255,255,0.7))';
  } else {
    // Default: hover eases logo glow from 1px → 4px blur
    logoFilter     = hovering
      ? 'drop-shadow(0 0 4px rgba(255,255,255,0.7))'
      : 'drop-shadow(0 0 1px rgba(255,255,255,0))';
    logoTransition = LOGO_TRANSITION;
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
      onMouseEnter={() => { if (isDefault) setHovering(true);  }}
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
            opacity:    isEliminated ? 0.2 : undefined,
            filter:     logoFilter,
            transition: logoTransition,
          }}
        />
      )}

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
