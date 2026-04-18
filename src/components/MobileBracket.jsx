import { useState, useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import MobileTeamButton from './MobileTeamButton';
import { ROUND1_MATCHUPS } from '../data/constants';
import { FF, C, ctrlBtnStyle } from '../styles/tokens';

// ─── Snap positions (scrollLeft values for each round) ────────────────────────
const SNAPS = [0, 230, 516, 795, 1070, 1350, 1591];

// ─── Column x-positions within scroll content (240px wide each) ───────────────
const COL_X = {
  WR1:  0,
  WR2:  302,
  WCF:  588,
  CUP:  870,
  ECF:  1148,
  ER2:  1410,
  ER1:  1668,
};

// Total scroll content width = ER1 + 240 + right padding (76px) = 1984
const CONTENT_W = 1984;

// ─── Match vertical positions ─────────────────────────────────────────────────
const R1_TOPS   = [0, 157, 314, 471];
const R2_TOPS   = [79, 393];
const CONF_TOP  = 236;
const COL_H     = 588;

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

  // ── Shared match renderer ──────────────────────────────────────────────────
  function MatchCol({ match, top }) {
    return (
      <div style={{ position: 'absolute', top, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                fontFamily: FF, fontSize: 9, fontWeight: 700,
                color: C.muted, letterSpacing: '0.55px', textTransform: 'uppercase',
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
                fontFamily: FF, fontSize: 9, fontWeight: 700,
                color: C.muted, letterSpacing: '0.55px', textTransform: 'uppercase',
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
          marginLeft: -16,
          marginRight: -16,
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
          <div style={{ position: 'absolute', left: COL_X.WR1 + 32, top: 0, width: 240, height: COL_H }}>
            {westR1.map((m, i) => (
              <MatchCol key={m.id} match={m} top={R1_TOPS[i]} />
            ))}
          </div>

          {/* ── West R2 ──────────────────────────────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.WR2 + 16, top: 0, width: 240, height: COL_H }}>
            {[semis[0], semis[1]].map((m, i) => (
              <MatchCol key={m.id} match={m} top={R2_TOPS[i]} />
            ))}
          </div>

          {/* ── WCF ──────────────────────────────────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.WCF + 16, top: 0, width: 240, height: COL_H }}>
            <MatchCol match={wcf} top={CONF_TOP} />
          </div>

          {/* ── Cup Final + trophy + champ pill ──────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.CUP + 16, top: 0, width: 240, height: COL_H }}>
            <img
              src={`${import.meta.env.BASE_URL}stcup.svg`}
              alt="Stanley Cup"
              style={{
                position: 'absolute',
                top: CONF_TOP - 80,
                left: '50%', transform: 'translateX(-50%)',
                width: 46, height: 68,
                objectFit: 'contain',
                pointerEvents: 'none', userSelect: 'none',
              }}
            />
            {champ && (
              <div style={{
                position: 'absolute',
                top: CONF_TOP - 42,
                left: '50%', transform: 'translateX(-50%)',
                zIndex: 5,
                width: 155, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(24,24,24,0.95)',
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
            <MatchCol match={ecf} top={CONF_TOP} />
          </div>

          {/* ── East R2 ──────────────────────────────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.ER2 + 16, top: 0, width: 240, height: COL_H }}>
            {[semis[2], semis[3]].map((m, i) => (
              <MatchCol key={m.id} match={m} top={R2_TOPS[i]} />
            ))}
          </div>

          {/* ── East R1 ──────────────────────────────────────────────────────── */}
          <div style={{ position: 'absolute', left: COL_X.ER1 + 16, top: 0, width: 240, height: COL_H }}>
            {eastR1.map((m, i) => (
              <MatchCol key={m.id} match={m} top={R1_TOPS[i]} />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
