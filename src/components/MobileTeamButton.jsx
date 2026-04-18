import { useState } from 'react';
import { SEEDS, TEAM_STYLES } from '../data/constants';
import { LOGOS } from '../data/logos';
import { FF } from '../styles/tokens';

// Full city/team names for the 240px mobile button
const CITY = {
  COL: 'Colorado',     LAK: 'Los Angeles',  DAL: 'Dallas',
  MIN: 'Minnesota',    EDM: 'Edmonton',      UTA: 'Utah',
  ANA: 'Anaheim',      VGK: 'Las Vegas',     TBL: 'Tampa Bay',
  BOS: 'Boston',       BUF: 'Buffalo',       MTL: 'Montreal',
  CAR: 'Carolina',     OTT: 'Ottawa',        PIT: 'Pittsburgh',
  PHI: 'Philadelphia',
};

// Logo positions tuned for 240px-wide button (logos shifted right vs 168px desktop)
const LOGO_POS = {
  COL: { left: 121, top: -20, width: 148, height: 98  },
  LAK: { left: 125, top: -18, width: 140, height: 93  },
  DAL: { left: 121, top: -27, width: 161, height: 106 },
  MIN: { left: 123, top: -18, width: 142, height: 95  },
  EDM: { left: 116, top: -23, width: 157, height: 106 },
  UTA: { left: 126, top: -18, width: 137, height: 90  },
  ANA: { left: 127, top: -12, width: 138, height: 89  },
  VGK: { left: 120, top: -21, width: 150, height: 99  },
  TBL: { left: 125, top: -15, width: 135, height: 89  },
  BOS: { left: 126, top: -16, width: 135, height: 90  },
  BUF: { left: 124, top: -19, width: 144, height: 94  },
  MTL: { left: 128, top: -15, width: 135, height: 88  },
  CAR: { left: 128, top: -17, width: 136, height: 91  },
  OTT: { left: 125, top: -16, width: 137, height: 90  },
  PIT: { left: 133, top: -11, width: 130, height: 86  },
  PHI: { left: 118, top: -23, width: 155, height: 103 },
};

const GLOW_COLOR = {
  BOS: '#FFD700', PIT: '#FFD700', LAK: '#A2AAAD', MIN: '#FF1235',
  OTT: '#FF2649', VGK: '#B9975B', BUF: '#FFB81C', TBL: '#2185FF',
  EDM: '#FF8D75', ANA: '#FF8D75', PHI: '#FF8D75', COL: '#44A9F9',
  DAL: '#00E96C', CAR: '#FF233F', MTL: '#FF233F',
};

function toRgba(color, alpha) {
  const rgb = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgb) return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${alpha})`;
  const h = color.replace('#', '');
  const f = h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h;
  return `rgba(${parseInt(f.slice(0,2),16)},${parseInt(f.slice(2,4),16)},${parseInt(f.slice(4,6),16)},${alpha})`;
}

function teamBackground(team) {
  const s = TEAM_STYLES[team];
  if (!s) return '#1c1b19';
  if (!s.overlay) return s.bg;
  return `linear-gradient(rgba(0,0,0,${s.overlay}),rgba(0,0,0,${s.overlay})),linear-gradient(${s.bg},${s.bg})`;
}

const TRANSITION = 'opacity 0.25s ease-in-out, filter 0.25s ease-in-out';
const LOGO_TRANSITION = 'filter 0.25s ease-in-out';

export default function MobileTeamButton({ team, matchId, picks, onPick, position = 'top' }) {
  const [hovering, setHovering] = useState(false);
  const radius = position === 'top' ? '8px 8px 0 0' : '0 0 8px 8px';

  if (!team) {
    return (
      <div
        style={{
          height: 58, width: 240, flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: radius,
          background: 'rgba(255,255,255,0.03)',
        }}
      />
    );
  }

  const picked       = picks[matchId] || null;
  const isWinner     = picked === team;
  const isEliminated = !!(picked && picked !== team);

  const baseColor   = TEAM_STYLES[team]?.bg ?? '#333';
  const glowSrc     = GLOW_COLOR[team] ?? baseColor;
  const glowBright  = toRgba(glowSrc, 0.85);
  const glowDim     = toRgba(glowSrc, 0.40);
  const GLOW_SHADOW = '0 0 32px 4px var(--glow-dim), inset 0 0 0 1px rgba(255,255,255,0.25)';

  const POP = 'teamPop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both';

  let buttonStyle;
  if (isWinner) {
    buttonStyle = {
      background: teamBackground(team), boxShadow: 'none',
      transition: 'box-shadow 1s ease-in-out',
      animation:  POP,
      '--glow-bright': glowBright, '--glow-dim': glowDim,
    };
  } else if (isEliminated) {
    buttonStyle = {
      background:  teamBackground(team),
      opacity:     hovering ? 1 : 0.35,
      transition:  TRANSITION,
      animation:   POP,
      '--glow-bright': glowBright,
    };
  } else {
    buttonStyle = {
      background:   teamBackground(team),
      boxShadow:    hovering ? GLOW_SHADOW : 'none',
      transition:   'box-shadow 0.25s ease-in-out',
      animation:    POP,
      '--glow-bright': glowBright, '--glow-dim': glowDim,
    };
  }

  const LOGO_GLOW   = 'drop-shadow(0 0 4px rgba(255,255,255,0.7))';
  const LOGO_HIDDEN = 'drop-shadow(0 0 1px rgba(255,255,255,0))';
  let logoFilter;
  if (isWinner)     logoFilter = LOGO_HIDDEN;
  else if (isEliminated) logoFilter = hovering ? LOGO_GLOW : 'grayscale(1)';
  else              logoFilter = hovering ? LOGO_GLOW : LOGO_HIDDEN;

  const logoUri = LOGOS[team] || '';
  const logoPos = LOGO_POS[team] ?? { left: 122, top: -20, width: 140, height: 93 };

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onPick(matchId, team); }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        ...buttonStyle, borderRadius: radius,
        height: 58, width: 240, flexShrink: 0,
        position: 'relative', overflow: 'hidden',
        cursor: 'pointer', padding: 0, border: 0,
        display: 'block', textAlign: 'left',
      }}
    >
      {logoUri && (
        <img
          src={logoUri}
          alt={team}
          style={{
            position: 'absolute',
            left: logoPos.left, top: logoPos.top,
            width: logoPos.width, height: logoPos.height,
            objectFit: 'contain', pointerEvents: 'none',
            filter: logoFilter,
            transition: isWinner ? 'filter 1s ease-in-out' : LOGO_TRANSITION,
          }}
        />
      )}

      <div style={{
        position: 'absolute', inset: '0 0 0 0',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 2, left: 16,
      }}>
        <span style={{
          fontFamily: FF, fontSize: 15, fontWeight: 800,
          color: '#ffffff', letterSpacing: '0.45px',
          textTransform: 'uppercase', lineHeight: 1.1,
          whiteSpace: 'nowrap',
        }}>
          {CITY[team] || team}
        </span>
        <span style={{
          fontFamily: FF, fontSize: 11, fontWeight: 600,
          color: 'rgba(255,255,255,0.7)', letterSpacing: '0.33px',
          lineHeight: 1,
        }}>
          {SEEDS[team] || ''}
        </span>
      </div>
    </button>
  );
}
