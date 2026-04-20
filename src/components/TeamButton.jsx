import { useState } from 'react';
import { SEEDS, TEAM_STYLES } from '../data/constants';
import { LOGOS } from '../data/logos';
import { FF } from '../styles/tokens';
import {
  LOGO_POS, GLOW_COLOR, CITY,
  CARD_W_DESKTOP, CARD_W_MOBILE, CARD_H,
  TRANSITION, LOGO_TRANSITION, GLOW_SHADOW, POP, LOGO_GLOW, LOGO_HIDDEN,
  toRgba, teamBackground,
} from '../utils/teamButton';

/**
 * Team matchup button — shared by desktop bracket and mobile bracket.
 * Pass mobile={true} for the 240px wide variant with full city names.
 */
export default function TeamButton({ team, matchId, picks, onPick, position = 'top', mobile = false }) {
  const [hovering, setHovering] = useState(false);

  const width  = mobile ? CARD_W_MOBILE : CARD_W_DESKTOP;
  const radius = position === 'top' ? '8px 8px 0 0' : '0 0 8px 8px';

  if (!team) {
    return (
      <div style={{
        height: CARD_H, width, flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: radius,
        background: 'rgba(255,255,255,0.03)',
      }} />
    );
  }

  const picked       = picks[matchId] || null;
  const isWinner     = picked === team;
  const isEliminated = !!(picked && picked !== team);

  const baseColor  = TEAM_STYLES[team]?.bg ?? '#333';
  const glowSrc    = GLOW_COLOR[team] ?? baseColor;
  const glowBright = toRgba(glowSrc, 0.85);
  const glowDim    = toRgba(glowSrc, 0.40);

  // ── Button style ─────────────────────────────────────────────────────────────
  let buttonStyle;
  if (isWinner) {
    buttonStyle = {
      background: teamBackground(team), boxShadow: 'none',
      transition: 'box-shadow 1s ease-in-out',
      animation: POP,
      '--glow-bright': glowBright, '--glow-dim': glowDim,
    };
  } else if (isEliminated) {
    buttonStyle = {
      background: hovering ? teamBackground(team) : 'rgba(255,255,255,0.04)',
      filter:     hovering ? 'none' : 'grayscale(1)',
      transition: TRANSITION,
      animation:  POP,
      '--glow-bright': glowBright,
    };
  } else {
    buttonStyle = {
      background: teamBackground(team),
      boxShadow:  hovering ? GLOW_SHADOW : 'none',
      transition: 'box-shadow 0.25s ease-in-out',
      animation:  POP,
      '--glow-bright': glowBright, '--glow-dim': glowDim,
    };
  }

  // Winner fades out logo glow via its 1s transition; all others: glow on hover
  const logoFilter = isWinner ? LOGO_HIDDEN : (hovering ? LOGO_GLOW : LOGO_HIDDEN);

  const logoUri  = LOGOS[team] || '';
  const logoPos  = LOGO_POS[team] ?? { left: 50, top: -20, width: 140, height: 93 };
  // Mobile logos shift 72px right relative to desktop positions
  const logoLeft = mobile ? logoPos.left + 72 : logoPos.left;

  const displayName = mobile ? (CITY[team] || team) : team;
  const nameStyle   = mobile
    ? { fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.45px', lineHeight: 1.1, whiteSpace: 'nowrap' }
    : { fontSize: 16, fontWeight: 700, letterSpacing: '0.48px' };

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onPick(matchId, team); }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        ...buttonStyle, borderRadius: radius,
        height: CARD_H, width, flexShrink: 0,
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
            left: logoLeft, top: logoPos.top,
            width: logoPos.width, height: logoPos.height,
            objectFit: 'contain', pointerEvents: 'none',
            filter: logoFilter,
            opacity: isEliminated && !hovering ? 0.35 : 1,
            transition: isWinner
              ? 'filter 1s ease-in-out'
              : `${LOGO_TRANSITION}, opacity 0.25s ease-in-out`,
          }}
        />
      )}

      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 16,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 2,
        opacity: isEliminated && !hovering ? 0.35 : 1,
        transition: 'opacity 0.25s ease-in-out',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontFamily: FF, color: '#ffffff', ...nameStyle }}>
          {displayName}
        </span>
        <span style={{
          fontFamily: FF, fontSize: 11, fontWeight: 600,
          color: 'rgba(255,255,255,0.7)', letterSpacing: '0.33px', lineHeight: 1,
        }}>
          {SEEDS[team] || ''}
        </span>
      </div>
    </button>
  );
}
