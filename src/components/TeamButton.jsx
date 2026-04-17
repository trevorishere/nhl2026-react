import { useState } from 'react';
import { SEEDS, TEAM_STYLES } from '../data/constants';
import { LOGOS } from '../data/logos';
import { FF } from '../styles/tokens';

// Logo positions extracted exactly from Figma frame 123:29
const LOGO_POS = {
  COL: { left: 49,  top: -20, width: 148, height: 98  },
  LAK: { left: 53,  top: -18, width: 140, height: 93  },
  DAL: { left: 49,  top: -27, width: 161, height: 106 },
  MIN: { left: 51,  top: -18, width: 142, height: 95  },
  EDM: { left: 44,  top: -23, width: 157, height: 106 },
  UTA: { left: 54,  top: -18, width: 137, height: 90  },
  ANA: { left: 55,  top: -12, width: 138, height: 89  },
  VGK: { left: 48,  top: -21, width: 150, height: 99  },
  TBL: { left: 53,  top: -15, width: 135, height: 89  },
  BOS: { left: 54,  top: -16, width: 135, height: 90  },
  BUF: { left: 52,  top: -19, width: 144, height: 94  },
  MTL: { left: 56,  top: -15, width: 135, height: 88  },
  CAR: { left: 56,  top: -17, width: 136, height: 91  },
  OTT: { left: 53,  top: -16, width: 137, height: 90  },
  PIT: { left: 61,  top: -11, width: 130, height: 86  },
  PHI: { left: 46,  top: -23, width: 155, height: 103 },
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
  EDM: '#FF8D75',
  ANA: '#FF8D75',
  PHI: '#FF8D75',
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

export default function TeamButton({ team, matchId, picks, onPick, position = 'top' }) {
  const [hovering, setHovering] = useState(false);

  // Blank / TBD slot
  const radius = position === 'top' ? '8px 8px 0 0' : '0 0 8px 8px';

  if (!team) {
    return <div className="h-[58px] w-[168px] shrink-0" style={{ border: '1px solid #393836', borderRadius: radius, background: 'rgba(255,255,255,0.03)' }} />;
  }

  const picked       = picks[matchId] || null;
  const isWinner     = picked === team;
  const isEliminated = !!(picked && picked !== team);

  const baseColor = TEAM_STYLES[team]?.bg ?? '#333';

  const glowSrc    = GLOW_COLOR[team] ?? baseColor;
  const glowBright = toRgba(glowSrc, 0.85);
  const glowDim    = toRgba(glowSrc, 0.40);

  // ── Button style ─────────────────────────────────────────────────────────
  const GLOW_SHADOW = `0 0 32px 4px var(--glow-dim), inset 0 0 0 1px rgba(255,255,255,0.25)`;

  let buttonStyle;
  if (isWinner) {
    // Winner: same as default (no glow). Click inherits rollover glow and the
    // 1s transition fades it out — no burst, just a smooth release.
    buttonStyle = {
      background:      teamBackground(team),
      boxShadow:       'none',
      transition:      'box-shadow 1s ease-in-out',
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
    // Default (no pick made): flat team bg; glow appears on hover only
    buttonStyle = {
      background:      teamBackground(team),
      boxShadow:       hovering ? GLOW_SHADOW : 'none',
      transition:      'box-shadow 0.25s ease-in-out',
      '--glow-bright': glowBright,
      '--glow-dim':    glowDim,
    };
  }

  // ── Logo style ───────────────────────────────────────────────────────────
  const LOGO_GLOW   = 'drop-shadow(0 0 4px rgba(255,255,255,0.7))';
  const LOGO_HIDDEN = 'drop-shadow(0 0 1px rgba(255,255,255,0))';

  let logoFilter;
  if (isWinner) {
    // Winner: same as default (no glow) — fades from rollover via 1s transition
    logoFilter = LOGO_HIDDEN;
  } else if (isEliminated) {
    logoFilter = hovering ? LOGO_GLOW : 'grayscale(1)';
  } else {
    // Default: logo glow on hover only; invisible value keeps transition smooth
    logoFilter = hovering ? LOGO_GLOW : LOGO_HIDDEN;
  }

  const logoUri = LOGOS[team] || '';
  const logoPos = LOGO_POS[team] ?? { left: 50, top: -20, width: 140, height: 93 };

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onPick(matchId, team); }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="h-[58px] w-[168px] shrink-0 relative overflow-hidden cursor-pointer p-0 border-0 block text-left"
      style={{ ...buttonStyle, borderRadius: radius }}
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
            transition: isWinner ? 'filter 1s ease-in-out' : LOGO_TRANSITION,
          }}
        />
      )}

      <div
        className="absolute inset-y-0 flex flex-col justify-center gap-[2px] whitespace-nowrap"
        style={{ left: 16 }}
      >
        <span
          className="text-white text-[16px] font-bold leading-normal"
          style={{ fontFamily: FF, letterSpacing: '0.48px' }}
        >
          {team}
        </span>
        <span
          className="text-[11px] font-semibold leading-normal"
          style={{ fontFamily: FF, letterSpacing: '0.33px', color: 'rgba(255,255,255,0.7)' }}
        >
          {SEEDS[team] || ''}
        </span>
      </div>
    </button>
  );
}
