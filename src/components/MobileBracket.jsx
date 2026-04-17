import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import MobileTeamButton from './MobileTeamButton';
import { ROUND1_MATCHUPS, TEAM_STYLES } from '../data/constants';
import { FF, C, ctrlBtnStyle } from '../styles/tokens';

// ─── Snap positions (scrollLeft values for each round) ────────────────────────
const SNAPS = [0, 230, 516, 795, 1070, 1350, 1591];

// ─── Column x-positions within scroll content (240px wide each) ───────────────
// Derived so each column centers at its snap + half-viewport
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

// ─── Match vertical positions within each column (117px match height) ─────────
// R1 columns: 4 matches with 40px gap between each
const R1_TOPS = [0, 157, 314, 471];
// R2 columns: 2 matches, vertically centered between adjacent R1 pairs
const R2_TOPS = [79, 393];
// Finals/Cup: 1 match, centered between the two R2 matches
const CONF_TOP = 236;

const COL_H = 588; // 471 + 117

// Button height + 1px gap between top/bottom
const BTN_H   = 58;
const MATCH_H = 117; // 58+1+58

// ─── Connector line geometry ───────────────────────────────────────────────────
// Returns SVG <path> data for a bracket connector between two inputs and one output
// fromY1/fromY2: y-centers of the two source buttons
// toY: y-center of the destination button
// fromX: x of source right edge; toX: x of destination left edge
// mid: x of the vertical junction
function bracketPath(fromX, fromY1, fromY2, toX, toY, mid) {
  return [
    `M ${fromX} ${fromY1} H ${mid}`,
    `M ${fromX} ${fromY2} H ${mid}`,
    `M ${mid} ${fromY1} V ${fromY2}`,
    `M ${mid} ${toY} H ${toX}`,
  ].join(' ');
}

// Simple horizontal connector (WCF → Cup, Cup → ECF)
function hPath(x1, y, x2) {
  return `M ${x1} ${y} H ${x2}`;
}

// Pre-compute all connector paths
function buildConnectors() {
  const lines = [];
  const mc = (top) => top + BTN_H / 2; // match center y = top + 29

  // ── West R1 → West R2 ───────────────────────────────────────────────────────
  const wr1Right = COL_X.WR1 + 240;
  const wr2Left  = COL_X.WR2;
  const wmid1    = (wr1Right + wr2Left) / 2;

  lines.push(bracketPath(
    wr1Right, mc(R1_TOPS[0]), mc(R1_TOPS[1]),
    wr2Left,  mc(R2_TOPS[0]), wmid1,
  ));
  lines.push(bracketPath(
    wr1Right, mc(R1_TOPS[2]), mc(R1_TOPS[3]),
    wr2Left,  mc(R2_TOPS[1]), wmid1,
  ));

  // ── West R2 → WCF ───────────────────────────────────────────────────────────
  const wr2Right = COL_X.WR2 + 240;
  const wcfLeft  = COL_X.WCF;
  const wmid2    = (wr2Right + wcfLeft) / 2;

  lines.push(bracketPath(
    wr2Right, mc(R2_TOPS[0]), mc(R2_TOPS[1]),
    wcfLeft,  mc(CONF_TOP),   wmid2,
  ));

  // ── WCF → Cup ───────────────────────────────────────────────────────────────
  lines.push(hPath(COL_X.WCF + 240, mc(CONF_TOP), COL_X.CUP));

  // ── Cup → ECF ───────────────────────────────────────────────────────────────
  lines.push(hPath(COL_X.CUP + 240, mc(CONF_TOP), COL_X.ECF));

  // ── ECF → East R2 ───────────────────────────────────────────────────────────
  const ecfRight = COL_X.ECF + 240;
  const er2Left  = COL_X.ER2;
  const emid2    = (ecfRight + er2Left) / 2;

  // ECF fans OUT to two East R2 matches (reverse of west pattern)
  lines.push([
    `M ${ecfRight} ${mc(CONF_TOP)} H ${emid2}`,
    `M ${emid2} ${mc(R2_TOPS[0])} V ${mc(R2_TOPS[1])}`,
    `M ${emid2} ${mc(R2_TOPS[0])} H ${er2Left}`,
    `M ${emid2} ${mc(R2_TOPS[1])} H ${er2Left}`,
  ].join(' '));

  // ── East R2 → East R1 ───────────────────────────────────────────────────────
  // East flows right-to-left: East R1 left edge connects to East R2 right edge
  const er2Right = COL_X.ER2 + 240;
  const er1Left  = COL_X.ER1;
  const emid1    = (er2Right + er1Left) / 2;

  lines.push(bracketPath(
    er1Left, mc(R1_TOPS[0]), mc(R1_TOPS[1]),
    er2Right, mc(R2_TOPS[0]), emid1,
  ));
  lines.push(bracketPath(
    er1Left, mc(R1_TOPS[2]), mc(R1_TOPS[3]),
    er2Right, mc(R2_TOPS[1]), emid1,
  ));

  return lines;
}

const CONNECTOR_PATHS = buildConnectors();

// ─── Nav labels ───────────────────────────────────────────────────────────────
const NAV = [
  { label: 'R1',  west: true  },
  { label: 'R2',  west: true  },
  { label: 'WCF', west: true  },
  { label: '',    cup: true   },
  { label: 'ECF', east: true  },
  { label: 'R2',  east: true  },
  { label: 'R1',  east: true  },
];

// ─── Mini bracket (intro overview) ────────────────────────────────────────────
function MiniBracket({ picks }) {
  const westR1 = ROUND1_MATCHUPS.filter(m => m.id.startsWith('W'));
  const eastR1 = ROUND1_MATCHUPS.filter(m => m.id.startsWith('E'));

  function MiniSlot({ team }) {
    const bg = team
      ? (TEAM_STYLES[team]?.bg ?? '#333')
      : 'rgba(255,255,255,0.06)';
    return (
      <div style={{
        height: 12, width: 44, borderRadius: 2,
        background: bg, flexShrink: 0,
      }} />
    );
  }

  function MiniMatch({ match }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <MiniSlot team={match.teams[0]} />
        <MiniSlot team={match.teams[1]} />
      </div>
    );
  }

  // Gray placeholder columns for later rounds
  function GrayCol({ count }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'space-around', height: '100%' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ height: 12, width: 32, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ height: 12, width: 32, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
      {/* West R1 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {westR1.map(m => <MiniMatch key={m.id} match={m} />)}
      </div>

      {/* West later rounds */}
      <div style={{ height: 100, display: 'flex', gap: 6, alignItems: 'center' }}>
        <GrayCol count={2} />
        <GrayCol count={1} />
      </div>

      {/* Cup */}
      <img
        src={`${import.meta.env.BASE_URL}stcup.svg`}
        alt="Stanley Cup"
        style={{ width: 36, height: 54, objectFit: 'contain', opacity: 0.9 }}
      />

      {/* East later rounds */}
      <div style={{ height: 100, display: 'flex', gap: 6, alignItems: 'center' }}>
        <GrayCol count={1} />
        <GrayCol count={2} />
      </div>

      {/* East R1 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {eastR1.map(m => <MiniMatch key={m.id} match={m} />)}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function MobileBracket({ picks, onPick, onReset }) {
  const [started,     setStarted]     = useState(false);
  const [activeRound, setActiveRound] = useState(0);
  const [resetHover,  setResetHover]  = useState(false);
  const scrollRef = useRef(null);
  const isScrolling = useRef(false);

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
  const wcf  = { id: 'F2', teams: [getPick('S3'), getPick('S4')] };
  const ecf  = { id: 'F1', teams: [getPick('S1'), getPick('S2')] };
  const cup  = { id: 'C1', teams: [getPick('F2'), getPick('F1')] };
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

  // Kick to West R1 on first open
  useEffect(() => {
    if (started && scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      setActiveRound(0);
    }
  }, [started]);

  // ── Shared match renderer ──────────────────────────────────────────────────
  function MatchCol({ match, top }) {
    return (
      <div style={{
        position: 'absolute', top,
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
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

  // ── Nav underline x positions (based on 7 equal segments of nav width) ─────
  // We'll compute dynamically via refs; use CSS custom property approach instead.

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Intro overlay ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 32,
        background: 'transparent',
        opacity: started ? 0 : 1,
        pointerEvents: started ? 'none' : 'auto',
        transition: 'opacity 0.4s ease',
      }}>
        <MiniBracket picks={picks} />

        <button
          onClick={() => setStarted(true)}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: FF, fontSize: 24, fontWeight: 800,
            color: C.text, letterSpacing: '2px', textTransform: 'uppercase',
          }}
        >
          Start Now
        </button>
      </div>

      {/* ── Bracket view (fades in after Start Now) ────────────────────────── */}
      <div style={{
        opacity: started ? 1 : 0,
        pointerEvents: started ? 'auto' : 'none',
        transition: 'opacity 0.4s ease',
      }}>

        {/* Nav bar */}
        <div style={{ marginBottom: 12 }}>
          {/* Conference labels */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            paddingLeft: 8, paddingRight: 8, marginBottom: 4,
          }}>
            <span style={{
              fontFamily: FF, fontSize: 9, fontWeight: 700,
              color: C.muted, letterSpacing: '0.6px', textTransform: 'uppercase',
            }}>
              Western Conference
            </span>
            <span style={{
              fontFamily: FF, fontSize: 9, fontWeight: 700,
              color: C.muted, letterSpacing: '0.6px', textTransform: 'uppercase',
            }}>
              Eastern Conference
            </span>
          </div>

          {/* Round labels row */}
          <div style={{ position: 'relative', display: 'flex' }}>
            {NAV.map((item, idx) => (
              <button
                key={idx}
                onClick={() => scrollToRound(idx)}
                style={{
                  flex: 1, background: 'none', border: 'none',
                  padding: '6px 0 10px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {item.cup ? (
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    {activeRound === idx && (
                      <span style={{
                        position: 'absolute',
                        width: 36, height: 36,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
                        pointerEvents: 'none',
                      }} />
                    )}
                    <img
                      src={`${import.meta.env.BASE_URL}stcup.svg`}
                      alt="Stanley Cup"
                      style={{ width: 16, height: 22, objectFit: 'contain', position: 'relative', zIndex: 1 }}
                    />
                  </span>
                ) : (
                  <span style={{
                    fontFamily: FF, fontSize: 11, fontWeight: 700,
                    color: activeRound === idx ? C.text : C.muted,
                    letterSpacing: '0.55px', textTransform: 'uppercase',
                    transition: 'color 0.15s ease',
                  }}>
                    {item.label}
                  </span>
                )}

                {/* Underline (non-cup items only) */}
                {!item.cup && activeRound === idx && (
                  <span style={{
                    position: 'absolute', bottom: 0, left: '15%', right: '15%',
                    height: 2, borderRadius: 1,
                    background: C.text,
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />

          {/* Reset button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
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

        {/* Horizontal scroll bracket */}
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
            // The COL_X values assume left edge of actual bracket content starts at x=0
            // We add 16px of padding each side so it doesn't touch the screen edge
          }}>

            {/* SVG connector lines overlay */}
            <svg
              style={{ position: 'absolute', top: 0, left: 16, pointerEvents: 'none', overflow: 'visible' }}
              width={CONTENT_W - 32}
              height={COL_H}
            >
              {CONNECTOR_PATHS.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1.5}
                  fill="none"
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {/* ── West R1 ──────────────────────────────────────────────────── */}
            <div style={{ position: 'absolute', left: COL_X.WR1 + 16, top: 0, width: 240, height: COL_H }}>
              {westR1.map((m, i) => (
                <MatchCol key={m.id} match={m} top={R1_TOPS[i]} />
              ))}
            </div>

            {/* ── West R2 ──────────────────────────────────────────────────── */}
            <div style={{ position: 'absolute', left: COL_X.WR2 + 16, top: 0, width: 240, height: COL_H }}>
              {[semis[0], semis[1]].map((m, i) => (
                <MatchCol key={m.id} match={m} top={R2_TOPS[i]} />
              ))}
            </div>

            {/* ── WCF ──────────────────────────────────────────────────────── */}
            <div style={{ position: 'absolute', left: COL_X.WCF + 16, top: 0, width: 240, height: COL_H }}>
              <MatchCol match={wcf} top={CONF_TOP} />
            </div>

            {/* ── Cup Final + trophy + champ pill ──────────────────────────── */}
            <div style={{ position: 'absolute', left: COL_X.CUP + 16, top: 0, width: 240, height: COL_H }}>
              {/* Trophy above the match */}
              <img
                src={`${import.meta.env.BASE_URL}stcup.svg`}
                alt="Stanley Cup"
                style={{
                  position: 'absolute',
                  top: CONF_TOP - 80,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 46, height: 68,
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />

              {/* Champion pill (overlaps trophy bottom and match top) */}
              {champ && (
                <div style={{
                  position: 'absolute',
                  top: CONF_TOP - 42,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 5,
                  width: 155, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(24,24,24,0.95)',
                  border: '2px solid #747f92',
                  borderRadius: 4,
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

            {/* ── ECF ──────────────────────────────────────────────────────── */}
            <div style={{ position: 'absolute', left: COL_X.ECF + 16, top: 0, width: 240, height: COL_H }}>
              <MatchCol match={ecf} top={CONF_TOP} />
            </div>

            {/* ── East R2 ──────────────────────────────────────────────────── */}
            <div style={{ position: 'absolute', left: COL_X.ER2 + 16, top: 0, width: 240, height: COL_H }}>
              {[semis[2], semis[3]].map((m, i) => (
                <MatchCol key={m.id} match={m} top={R2_TOPS[i]} />
              ))}
            </div>

            {/* ── East R1 ──────────────────────────────────────────────────── */}
            <div style={{ position: 'absolute', left: COL_X.ER1 + 16, top: 0, width: 240, height: COL_H }}>
              {eastR1.map((m, i) => (
                <MatchCol key={m.id} match={m} top={R1_TOPS[i]} />
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Placeholder height when intro is showing (so page doesn't collapse) */}
      {!started && (
        <div style={{ height: COL_H + 100 }} />
      )}
    </div>
  );
}
