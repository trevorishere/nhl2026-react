/**
 * Shared constants and helpers for TeamButton (desktop + mobile).
 * Single source of truth — no duplication between the two variants.
 */
import { TEAM_STYLES } from '../data/constants';

// ── Logo positions extracted from Figma (desktop 168px button) ────────────────
// Mobile left = desktop left + 72 for every team (mechanically derived).
export const LOGO_POS = {
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

// ── Per-team glow colour overrides ────────────────────────────────────────────
export const GLOW_COLOR = {
  BOS: '#FFD700', PIT: '#FFD700', LAK: '#A2AAAD', MIN: '#FF1235',
  OTT: '#FF2649', VGK: '#B9975B', BUF: '#FFB81C', TBL: '#2185FF',
  EDM: '#FF8D75', ANA: '#FF8D75', PHI: '#FF8D75', COL: '#44A9F9',
  DAL: '#00E96C', CAR: '#FF233F', MTL: '#FF233F',
};

// ── Full city names for the wider mobile button ───────────────────────────────
export const CITY = {
  COL: 'Colorado',     LAK: 'Los Angeles',  DAL: 'Dallas',
  MIN: 'Minnesota',    EDM: 'Edmonton',      UTA: 'Utah',
  ANA: 'Anaheim',      VGK: 'Las Vegas',     TBL: 'Tampa Bay',
  BOS: 'Boston',       BUF: 'Buffalo',       MTL: 'Montreal',
  CAR: 'Carolina',     OTT: 'Ottawa',        PIT: 'Pittsburgh',
  PHI: 'Philadelphia',
};

// ── Shared visual constants ───────────────────────────────────────────────────
export const CARD_W_DESKTOP = 168;
export const CARD_W_MOBILE  = 240;
export const CARD_H         = 58;

export const TRANSITION      = 'opacity 0.25s ease-in-out, filter 0.25s ease-in-out';
export const LOGO_TRANSITION = 'filter 0.25s ease-in-out';
export const GLOW_SHADOW     = '0 0 32px 4px var(--glow-dim), inset 0 0 0 1px rgba(255,255,255,0.25)';
export const POP             = 'teamPop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both';
export const LOGO_GLOW       = 'drop-shadow(0 0 4px rgba(255,255,255,0.7))';
export const LOGO_HIDDEN     = 'drop-shadow(0 0 1px rgba(255,255,255,0))';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert hex OR rgb() colour string → rgba(r,g,b,alpha) */
export function toRgba(color, alpha) {
  const rgb = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgb) return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${alpha})`;
  const h = color.replace('#', '');
  const f = h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h;
  return `rgba(${parseInt(f.slice(0,2),16)},${parseInt(f.slice(2,4),16)},${parseInt(f.slice(4,6),16)},${alpha})`;
}

/** Build a CSS background value for a team, respecting optional overlay. */
export function teamBackground(team) {
  const s = TEAM_STYLES[team];
  if (!s) return '#1c1b19';
  if (!s.overlay) return s.bg;
  return `linear-gradient(rgba(0,0,0,${s.overlay}),rgba(0,0,0,${s.overlay})),linear-gradient(${s.bg},${s.bg})`;
}
