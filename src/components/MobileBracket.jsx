import { useState, useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import MobileTeamButton from './MobileTeamButton';
import { ROUND1_MATCHUPS } from '../data/constants';
import { FF, C, ctrlBtnStyle } from '../styles/tokens';

// ─── Snap positions (scrollLeft values for each round) ────────────────────────
const SNAPS = [0, 227, 513, 799, 1085, 1371, 1657];

// ─── Column x-positions within scroll content (240px wide each) ───────────────
// All columns use left = COL_X + 16 → equal 46px gap between every column
const COL_X = {
  WR1:     0,
  WR2:   286,
  WCF:   572,
  CUP:   858,
  ECF:  1144,
  ER2:  1430,
  ER1:  1716,
};

// Total scroll content width = ER1(1716) + 16 offset + 240 col + 16 right pad = 1988
const CONTENT_W = 1988;

// ─── Label height: 11px text × 1.4 line-height ≈ 16px + 8px gap below ────────
const LABEL_H = 24;

// ─── Match vertical positions (relative to content area below label) ──────────
const R1_TOPS   = [0, 157, 314, 471];
const R2_TOPS   = [79, 393];
const CONF_TOP  = 236;
const COL_H     = 588 + LABEL_H;

// ─── Label top positions: 8px gap above first match in each column ────────────
//   R1/ER1: first match @ 0+LABEL_H=24   → top:0 (1-line ~15px → gap≈9px) ✓
//   R2/ER2: first match @ 79+LABEL_H=103 → top:79
//   WCF/ECF: first match @ 236+LABEL_H=260, 2-line (~31px) → 260-8-31=221
//   CUP: 8px above trophy top rather than match
const R2_LABEL_TOP   = R2_TOPS[0];                    // 79
const CONF_LABEL_TOP = CONF_TOP + LABEL_H - 8 - 31;   // 221

// ─── Stanley Cup trophy sizing / positioning ──────────────────────────────────
const TROPHY_W   = 60;   // 46 × 1.3
const TROPHY_H   = 88;   // 68 × 1.3
const TROPHY_TOP = CONF_TOP - 80 + LABEL_H - 24;      // 180 → 156 (moved up 24px)
const CUP_LABEL_TOP  = TROPHY_TOP - 8 - 16;           // 8px above trophy: 132
const PILL_TOP   = TROPHY_TOP + Math.round(TROPHY_H / 2) - 15; // centered on trophy: 185

// ─── Main component ────────────────────────────────────────────────────────────
export default function MobileBracket({ picks, onPick, onReset }) {
  const [activeRound, setActiveRound] = useState(0);
  const [resetHover,  setResetHover]  = useState(false);
  const scrollRef = useRef(null);

  const getPick = (id) => picks[id] || null;

  // ── Bracket match data ─────────────────────────────────────────────────────
  const westR1 = ROUND1_MATCHUPS.filter(m => m.id.startsWith('W'));
  const eastR1 = ROUND1_MATCHUPS.filter(m => m.id.startsWith('E'));

  const semis = [
    { id: 'S3', teams: [getPick('W1'), getPick('W2')] },
    { id: 'S4', teams: [getPick('W3'), getPick('W4')] },
    { id: 'S1', teams: [getPick('E1'), getPick('E2')] },
    { id: 'S2', teams: [getPick('E3'), getPick('E4')] },
  ];
  const wcf   = { id: 'F2', teams: [getPick('S3'), getPick('S4')] };
  const ecf   = { id: 'F1', teams: [getPick('S1'), getPick('S2')] };
  const cup   = { id: 'C1', teams: [getPick('F2'), getPick('F1')] };
  const champ = getPick('C1');

  // ── Scroll → active round ──────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const sl = scrollRef.current.scrollLeft;
    let closest = 0, minDist = Infinity;
    SNAPS.forEach((s, i) => {
      const d = Math.abs(sl - s);
      if (d < minDist) { minDist = d; closest = i; }
    });
    setActiveRound(closest);
  }, []);

  function scrollToRound(idx) {
    scrollRef.current?.scrollTo({ left: SNAPS[idx], behavior: 'smooth' });
    setActiveRound(idx);
  }

  // ── Column title label ────────────────────────────────────────────────────
  const labelStyle = {
    position: 'absolute', left: 0, right: 0,
    textAlign: 'center',
    fontFamily: FF, fontSize: 11, fontWeight: 700,
    letterSpacing: '0.33px', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)', lineHeight: '1.4',
    margin: 0, pointerEvents: 'none',
  };

  // ── Shared match renderer ──────────────────────────────────────────────────
  function MatchCol({ match, top }) {
    return (
      <div style={{ position: 'absolute', top: top + LABEL_H, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {[0, 1].map(i => (
          <MobileTeamButton
            key={i}
            team={match.teams[i]}
            matchId={match.id}
            picks={picks}
            onPick={onPick}
            position={i === 0 ? 'top' : 'bottom'}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 8, overflowX: 'hidden' }}>
      {/* ── Nav bar ──────────────────────────────────────────────────────────── */}
      <div style={{ paddingLeft: 16, paddingRight: 16 }}>

        {/* Two-tier nav: west | cup | east, aligned to bottom */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>

          {/* West side — fluid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ height: 18, display: 'flex', alignItems: 'center' }}>
              <span style={{
                fontFamily: FF, fontSize: 10, fontWeight: 700,
                color: C.muted, letterSpacing: '0.75px', textTransform: 'uppercase',
              }}>Western Conference</span>
            </div>
            <div style={{ display: 'flex', height: 40 }}>
              {[
                { idx: 0, label: 'R1'  },
                { idx: 1, label: 'R2'  },
                { idx: 2, label: 'WCF' },
              ].map(({ idx, label }) => {
                const active = activeRound === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => scrollToRound(idx)}
                    style={{
                      flex: 1,
                      background: 'none', cursor: 'pointer',
                      border: 'none',
                      borderBottom: active ? `2px solid ${C.text}` : '2px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      paddingTop: 6, paddingBottom: 12,
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <span style={{
                      fontFamily: FF, fontSize: 13, fontWeight: 700,
                      color: active ? C.text : C.muted,
                      letterSpacing: '0.65px', textTransform: 'uppercase',
                      transition: 'color 0.15s ease',
                    }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cup section — 42px wide, 70px tall */}
          <div
            onClick={() => scrollToRound(3)}
            style={{
              width: 42, height: 70, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute',
              width: 79, height: 79, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)',
              opacity: activeRound === 3 ? 1 : 0,
              transition: 'opacity 0.2s ease',
              pointerEvents: 'none',
            }} />
            <img
              src={`${import.meta.env.BASE_URL}stcup.svg`}
              alt="Stanley Cup"
              style={{
                width: 38, height: 57, objectFit: 'contain',
                position: 'relative', zIndex: 1,
                opacity: activeRound === 3 ? 1 : 0.6,
                transition: 'opacity 0.2s ease',
              }}
            />
          </div>

          {/* East side — fluid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <span style={{
                fontFamily: FF, fontSize: 10, fontWeight: 700,
                color: C.muted, letterSpacing: '0.75px', textTransform: 'uppercase',
              }}>Eastern Conference</span>
            </div>
            <div style={{ display: 'flex', height: 40 }}>
              {[
                { idx: 4, label: 'ECF' },
                { idx: 5, label: 'R2'  },
                { idx: 6, label: 'R1'  },
              ].map(({ idx, label }) => {
                const active = activeRound === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => scrollToRound(idx)}
                    style={{
                      flex: 1,
                      background: 'none', cursor: 'pointer',
                      border: 'none',
                      borderBottom: active ? `2px solid ${C.text}` : '2px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      paddingTop: 6, paddingBottom: 12,
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <span style={{
                      fontFamily: FF, fontSize: 13, fontWeight: 700,
                      color: active ? C.text : C.muted,
                      letterSpacing: '0.65px', textTransform: 'uppercase',
                      transition: 'color 0.15s ease',
                    }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20 }} />

        {/* Reset button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <button
            style={ctrlBtnStyle(resetHover, { gap: 6, padding: '0 16px 0 14px' })}
            onClick={onReset}
            onMouseEnter={() => setResetHover(true)}
            onMouseLeave={() => setResetHover(false)}
          >
            <RotateCcw size={14} color="currentColor" strokeWidth={2} />
            Reset
          </button>
        </div>
      </div>

      {/* ── Horizontal scroll bracket ─────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mobile-bracket-strip"
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{
          position: 'relative',
          width: CONTENT_W,
          height: COL_H + 8,
          paddingLeft: 16,
          paddingRight: 16,
        }}>

          {/* ── West R1 ──────────────────────────────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.WR1 + 16, top: 0, width: 240, height: COL_H }}>
            <p style={{ ...labelStyle, top: 0 }}>First Round</p>
            {westR1.map((m, i) => (
              <MatchCol key={m.id} match={m} top={R1_TOPS[i]} />
            ))}
          </div>

          {/* ── West R2 ──────────────────────────────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.WR2 + 16, top: 0, width: 240, height: COL_H }}>
            <p style={{ ...labelStyle, top: R2_LABEL_TOP }}>Second Round</p>
            {[semis[0], semis[1]].map((m, i) => (
              <MatchCol key={m.id} match={m} top={R2_TOPS[i]} />
            ))}
          </div>

          {/* ── WCF ──────────────────────────────────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.WCF + 16, top: 0, width: 240, height: COL_H }}>
            <p style={{ ...labelStyle, top: CONF_LABEL_TOP }}>Western<br />Conference Final</p>
            <MatchCol match={wcf} top={CONF_TOP} />
          </div>

          {/* ── Cup Final + trophy + champ pill ──────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.CUP + 16, top: 0, width: 240, height: COL_H }}>
            <p style={{ ...labelStyle, top: CUP_LABEL_TOP }}>Cup Final</p>
            <img
              src={`${import.meta.env.BASE_URL}stcup.svg`}
              alt="Stanley Cup"
              style={{
                position: 'absolute',
                top: TROPHY_TOP,
                left: '50%', transform: 'translateX(-50%)',
                width: TROPHY_W, height: TROPHY_H,
                objectFit: 'contain',
                pointerEvents: 'none', userSelect: 'none',
              }}
            />
            {champ && (
              <div style={{
                position: 'absolute',
                top: PILL_TOP,
                left: '50%', transform: 'translateX(-50%)',
                zIndex: 5,
                width: 155, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(24,24,24,0.85)',
                border: '2px solid #747f92', borderRadius: 4,
                whiteSpace: 'nowrap',
              }}>
                <span style={{
                  fontFamily: FF, fontSize: 11, fontWeight: 500,
                  color: '#ffffff', letterSpacing: '0.28px',
                }}>
                  {champ} wins the Cup!
                </span>
              </div>
            )}
            <MatchCol match={cup} top={CONF_TOP} />
          </div>

          {/* ── ECF ──────────────────────────────────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.ECF + 16, top: 0, width: 240, height: COL_H }}>
            <p style={{ ...labelStyle, top: CONF_LABEL_TOP }}>Eastern<br />Conference Final</p>
            <MatchCol match={ecf} top={CONF_TOP} />
          </div>

          {/* ── East R2 ──────────────────────────────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.ER2 + 16, top: 0, width: 240, height: COL_H }}>
            <p style={{ ...labelStyle, top: R2_LABEL_TOP }}>Second Round</p>
            {[semis[2], semis[3]].map((m, i) => (
              <MatchCol key={m.id} match={m} top={R2_TOPS[i]} />
            ))}
          </div>

          {/* ── East R1 ──────────────────────────────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.ER1 + 16, top: 0, width: 240, height: COL_H }}>
            <p style={{ ...labelStyle, top: 0 }}>First Round</p>
            {eastR1.map((m, i) => (
              <MatchCol key={m.id} match={m} top={R1_TOPS[i]} />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
