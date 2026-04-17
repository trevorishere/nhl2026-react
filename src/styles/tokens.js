/**
 * Design tokens for the NHL 2026 bracket app.
 * Import from here instead of repeating magic values in components.
 */

// ── Font family ───────────────────────────────────────────────────────────────
export const FF = 'Figtree, sans-serif';

// ── Color tokens ─────────────────────────────────────────────────────────────
export const C = {
  text:       '#e7e4df',               // primary warm-white text
  textMuted:  'rgba(231,228,223,0.7)', // 70% warm-white (header metadata)
  muted:      '#a09d96',               // secondary labels, placeholders
  border:     '#393836',               // dividers, borders, dropdown bg
  surface:    'rgba(57,56,54,0.1)',    // panel background
  btnDefault: 'rgba(57,56,54,0.5)',    // buttons / dropdowns at rest
  btnHover:   '#444241',               // buttons / dropdowns on hover
  toggleOff:  'rgba(72,72,72,0.5)',    // toggle track — off state
  toggleOn:   '#4e4e4e',               // toggle track — on state
  accent:     '#4f98a3',               // projected-points teal
  injBg:      'rgba(255,0,0,0.1)',     // injury card background
  injBorder:  'rgba(255,0,0,0.3)',     // injury card border
  injLabel:   '#ff1a1a',               // injury type label
};

// ── Typography style objects ──────────────────────────────────────────────────
export const T = {
  // 13px / Bold / uppercase / 0.65px — section headers, filter labels, button text
  label: {
    fontFamily: FF, fontSize: 13, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.65px',
    color: C.muted, lineHeight: '19px', whiteSpace: 'nowrap',
  },

  // 11px / SemiBold / uppercase / 0.55px — stat sub-labels below values
  subLabel: {
    fontFamily: FF, fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.55px',
    color: C.muted, lineHeight: '15px',
  },

  // 16px / Bold — small stat value (Goals, Assists, Points, Avg TOI)
  statSm: {
    fontFamily: FF, fontSize: 16, fontWeight: 700,
    color: C.text, letterSpacing: '0.8px', lineHeight: '21px',
  },

  // 18px / Bold — medium stat value (PP Pts, L10 Pts)
  statMd: {
    fontFamily: FF, fontSize: 18, fontWeight: 700,
    color: C.text, letterSpacing: '0.9px', lineHeight: '21px',
  },

  // 24px / Bold — large projected-points value
  statLg: {
    fontFamily: FF, fontSize: 24, fontWeight: 700,
    letterSpacing: '1.2px', lineHeight: '21px',
  },

  // 10px / Bold / uppercase — toggle ON / OFF labels
  toggleLabel: {
    fontFamily: FF, fontSize: 10, fontWeight: 700,
    letterSpacing: '0.6px', textTransform: 'uppercase',
    color: C.text, pointerEvents: 'none', lineHeight: 1,
  },
};

// ── Button style helpers ──────────────────────────────────────────────────────

/**
 * 40px control button shared base (Reset, Autopick, filter dropdowns).
 * Pass opts to override gap / padding / justifyContent / color as needed.
 */
export function ctrlBtnStyle(hovering, opts = {}) {
  return {
    display: 'flex', alignItems: 'center',
    height: 36,
    background: 'transparent',
    border: '2px solid rgba(255,255,255,0.2)', borderRadius: 8, cursor: 'pointer',
    fontFamily: FF, fontSize: 12, fontWeight: 700,
    color: hovering ? C.text : C.muted,
    letterSpacing: '0.6px', textTransform: 'uppercase',
    whiteSpace: 'nowrap', transition: 'color 0.15s ease',
    ...opts,
  };
}

// ── Dropdown styles ───────────────────────────────────────────────────────────

/** Shared layout for dropdown option rows. Combine with a hover className. */
export const dropItemBase = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  height: 40, padding: '0 12px', cursor: 'pointer',
};

/** Floating dropdown panel wrapper. */
export const dropPanel = {
  position: 'absolute', top: 'calc(100% + 4px)', left: 0,
  zIndex: 50, background: '#1D1D1F', borderRadius: 8,
  minWidth: 120, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
};

// ── Toggle pill styles ────────────────────────────────────────────────────────

export const toggleTrack = (on) => ({
  cursor: 'pointer',
  background: on ? C.toggleOn : C.toggleOff,
  height: 24, width: 64, borderRadius: 9,
  position: 'relative', flexShrink: 0,
  transition: 'background 0.2s ease',
});

export const toggleKnob = (on) => ({
  position: 'absolute',
  background: on ? C.text : C.muted,
  height: 16, width: 28, borderRadius: 7,
  top: 4, left: on ? 31 : 5,
  transition: 'left 0.2s ease, background 0.2s ease',
});

export const toggleLabelOn = (on) => ({
  position: 'absolute', left: 9, top: '50%',
  transform: 'translateY(-50%)',
  ...T.toggleLabel,
  opacity: on ? 1 : 0,
  transition: 'opacity 0.2s ease',
});

export const toggleLabelOff = (on) => ({
  position: 'absolute', right: 6, top: '50%',
  transform: 'translateY(-50%)',
  ...T.toggleLabel,
  opacity: on ? 0 : 0.57,
  transition: 'opacity 0.2s ease',
});
