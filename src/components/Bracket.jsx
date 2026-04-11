import { useRef, useState, useEffect } from 'react';
import BracketColumn from './BracketColumn';
import { ROUND1_MATCHUPS } from '../data/constants';

// ─── Card dimensions ──────────────────────────────────────────────────────────
const CARD_W = 156;         // each team card width
const MATCH_H_NORMAL   = 118; // 58 + 2px gap + 58  (no game selector)
const MATCH_H_ADVANCED = 162; // 118 + 44px game-selector block

// ─── Vertical layout — from Figma frame 71:44839 ─────────────────────────────
//
// R1 match positions are taken directly from Figma (advanced mode frame):
//   block 164px + 32px within-div gap → next block
//   block 164px + 64px cross-div  gap → next block
//
// We use these same anchor positions for BOTH modes so the bracket is
// consistently tall; normal mode just has more breathing room below each card.
//
const R1_TOPS = [0, 196, 424, 620];

// Semi-final: centred between the two R1 matches it connects (midpoint of tops)
const SEMI_TOP_0 = (R1_TOPS[0] + R1_TOPS[1]) / 2; // 98
const SEMI_TOP_1 = (R1_TOPS[2] + R1_TOPS[3]) / 2; // 522

// Conference Final: centred between the two semis, then shifted up half a label
const LABEL_H      = 21; // single-line 11px label: ~13px text + 8px gap
const CONF_LABEL_H = 34; // two-line conf-final label: ~26px text + 8px gap
const FINAL_TOP    = Math.round((SEMI_TOP_0 + SEMI_TOP_1) / 2 - CONF_LABEL_H / 2); // 293

// Stanley Cup Final: place label so its cards align with the conf-final cards
const confFinalCardStart = FINAL_TOP + CONF_LABEL_H; // 327
const CUP_TOP = confFinalCardStart - LABEL_H;         // 306

const SEMIS_AND_FINAL_TOPS = [SEMI_TOP_0, FINAL_TOP, SEMI_TOP_1];
const CUP_TOPS = [CUP_TOP];

// ─── Column widths ────────────────────────────────────────────────────────────
//
//  R1 col    : 156px  — exactly one card wide
//  Semi+Final: 192px  — semi at left=0 (156px), conf-final offset 36px right
//  Cup Final : 176px  — card centred: left=10 (10+156=166 < 176)
//  Gap       : 40px
//
//  Natural bracket width = 156+192+176+192+156 + 4×40 = 1032px
//
const COL_SEMIS_W       = 192;
const COL_CUP_W         = 176;
const COL_GAP           = 40;
const BRACKET_NATURAL_W = CARD_W + COL_SEMIS_W + COL_CUP_W + COL_SEMIS_W + CARD_W + 4 * COL_GAP; // 1032

// West: semis flush left (near R1), conf-final shifted right (toward Cup)
const WEST_SEMIS_LEFTS = [0, 36, 0];
// East: conf-final at left, semis shifted right (near R1 on the far right)
const EAST_SEMIS_LEFTS = [36, 0, 36];

// ─── Scale-to-fit hook ───────────────────────────────────────────────────────
function useScaleToFit(naturalWidth) {
  const ref   = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / naturalWidth));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [naturalWidth]);

  return [ref, scale];
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Bracket({ picks, onPick, mode, seriesLengths, onSeriesLength }) {
  const [containerRef, scale] = useScaleToFit(BRACKET_NATURAL_W);

  // Column height depends on mode (R1 match height + bottom padding)
  const matchH = mode === 'advanced' ? MATCH_H_ADVANCED : MATCH_H_NORMAL;
  const COL_H  = R1_TOPS[3] + matchH + 20;

  const r1 = ROUND1_MATCHUPS;
  const getPick = (id) => picks[id] || null;

  // R1: no per-matchup labels
  const westR1 = r1.filter((m) => m.id.startsWith('W')).map((m) => ({ ...m, label: '' }));
  const eastR1 = r1.filter((m) => m.id.startsWith('E')).map((m) => ({ ...m, label: '' }));

  const semis = [
    { id: 'S1', teams: [getPick('E1'), getPick('E2')], label: 'R2' },
    { id: 'S2', teams: [getPick('E3'), getPick('E4')], label: 'R2' },
    { id: 'S3', teams: [getPick('W1'), getPick('W2')], label: 'R2' },
    { id: 'S4', teams: [getPick('W3'), getPick('W4')], label: 'R2' },
  ];

  const finals = [
    { id: 'F1', teams: [getPick('S1'), getPick('S2')], label: 'Eastern Conference Final' },
    { id: 'F2', teams: [getPick('S3'), getPick('S4')], label: 'Western Conference Final' },
  ];

  const cup = { id: 'C1', teams: [getPick('F1'), getPick('F2')], label: 'Cup Final' };

  const westSemisAndFinal = [
    semis.find((m) => m.id === 'S3'),
    finals.find((m) => m.id === 'F2'),
    semis.find((m) => m.id === 'S4'),
  ];
  const eastSemisAndFinal = [
    semis.find((m) => m.id === 'S1'),
    finals.find((m) => m.id === 'F1'),
    semis.find((m) => m.id === 'S2'),
  ];

  const champ = getPick('C1');

  const columnProps = { picks, onPick, mode, seriesLengths, onSeriesLength };

  return (
    <>
      {/* Outer: measures available width, clips scaled content */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden"
        style={{ height: COL_H * scale }}
      >
        {/* Inner: scaled to fit, always centred */}
        <div
          style={{
            width: BRACKET_NATURAL_W,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <div className="bracket-grid">
            {/* Col 1: West R1 */}
            <BracketColumn
              matches={westR1}
              tops={R1_TOPS}
              colHeight={COL_H}
              {...columnProps}
            />
            {/* Col 2: West Semis + Conference Final */}
            <BracketColumn
              matches={westSemisAndFinal}
              tops={SEMIS_AND_FINAL_TOPS}
              lefts={WEST_SEMIS_LEFTS}
              colHeight={COL_H}
              {...columnProps}
            />
            {/* Col 3: Stanley Cup Final */}
            <BracketColumn
              matches={[cup]}
              tops={CUP_TOPS}
              lefts={[10]}
              colHeight={COL_H}
              {...columnProps}
            />
            {/* Col 4: East Semis + Conference Final */}
            <BracketColumn
              matches={eastSemisAndFinal}
              tops={SEMIS_AND_FINAL_TOPS}
              lefts={EAST_SEMIS_LEFTS}
              colHeight={COL_H}
              {...columnProps}
            />
            {/* Col 5: East R1 */}
            <BracketColumn
              matches={eastR1}
              tops={R1_TOPS}
              colHeight={COL_H}
              {...columnProps}
            />
          </div>
        </div>
      </div>

      {/* Champion pill */}
      {champ && (
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-2 bg-surface2 border border-border px-3 py-2 rounded-full text-[14px] font-bold text-primary">
            🏆 {champ} wins the Cup!
          </span>
        </div>
      )}
    </>
  );
}
