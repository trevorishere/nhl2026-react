import { useRef, useState, useEffect } from 'react';
import BracketColumn from './BracketColumn';
import { ROUND1_MATCHUPS } from '../data/constants';

// ─── Card dimensions ──────────────────────────────────────────────────────────
const CARD_W = 156;  // each team card width
const CARD_H = 118;  // 58 + 2px gap + 58

// ─── Vertical layout constants ────────────────────────────────────────────────
//
// R1 matches have NO label (label overhead = 0).
// All other rounds use an 11px Figtree Bold label + 8px gap before the card stack.
//
// Gap values come directly from the design reference:
//   GAP_BEFORE_FINAL = 35px  (semi1 cards bottom → conf-final container top)
//   GAP_AFTER_FINAL  = 44px  (conf-final cards bottom → semi2 container top)
//   CONF_LABEL_TEXT  = 26px  ("WESTERN/EASTERN CONFERENCE FINAL" rendered 2-line height)
//   LABEL_H          = 21px  (single-line 11px label: ~13px text + 8px gap)
//   CONF_LABEL_H     = 34px  (26px text + 8px gap)
// ─────────────────────────────────────────────────────────────────────────────
const GAP_IN           = 40;   // within-division gap between card stacks
const GAP_OUT          = 88;   // cross-division gap between card stacks
const LABEL_H          = 21;   // single-line label overhead (R2, Cup Final…)
const CONF_LABEL_H     = 34;   // two-line conference final label overhead
const GAP_BEFORE_FINAL = 35;   // gap: semi1 bottom → conf-final top   (ref)
const GAP_AFTER_FINAL  = 44;   // gap: conf-final cards bottom → semi2 top (ref)

const R1_TOPS = [
  0,
  CARD_H + GAP_IN,                        // 158
  2 * CARD_H + GAP_IN + GAP_OUT,          // 364
  3 * CARD_H + 2 * GAP_IN + GAP_OUT,      // 522
];

// Semi1: centered between R1[0] and R1[1] card midpoints
const SEMI_TOP_0 = (R1_TOPS[0] + R1_TOPS[1]) / 2 - LABEL_H; // 58

// Conference Final: GAP_BEFORE_FINAL below the bottom of semi1's card stack
const semi1Bottom  = SEMI_TOP_0 + LABEL_H + CARD_H;           // 197
const FINAL_TOP    = semi1Bottom + GAP_BEFORE_FINAL;           // 232

// Semi2: GAP_AFTER_FINAL below the bottom of the Conference Final card stack
const confFinalBottom = FINAL_TOP + CONF_LABEL_H + CARD_H;    // 384
const SEMI_TOP_1   = confFinalBottom + GAP_AFTER_FINAL;        // 428

const SEMI_TOPS  = [SEMI_TOP_0, SEMI_TOP_1];
const FINAL_TOPS = [FINAL_TOP];                                // [232]

// Cup Final: cards aligned at the same Y as the Conference Final card start
const confFinalCardStart = FINAL_TOP + CONF_LABEL_H;           // 266
const CUP_TOPS   = [confFinalCardStart - LABEL_H];             // [245]

// Column height: tallest element is the last R1 match (no label): 522+118=640; +20px
const COL_H = R1_TOPS[3] + CARD_H + 20;                       // 660

// ─── Column widths ────────────────────────────────────────────────────────────
//
//  R1 col    : 156px  — exactly one card wide
//  Semi+Final: 192px  — semi at left=0 (156px), conf-final offset 36px right (36+156=192)
//  Cup Final : 176px  — card centered: left=10 (10+156=166 < 176)
//  Gap       : 40px
//
//  Natural bracket width = 156+192+176+192+156 + 4×40 = 1032px
//
const COL_SEMIS_W  = 192;
const COL_CUP_W    = 176;
const COL_GAP      = 40;
const BRACKET_NATURAL_W = CARD_W + COL_SEMIS_W + COL_CUP_W + COL_SEMIS_W + CARD_W + 4 * COL_GAP; // 1032

// West: semis flush left (near R1), conf-final shifted right (toward Cup)
// East: semis shifted right (near R1 on the far right), conf-final at left (toward Cup)
const WEST_SEMIS_LEFTS = [0, 36, 0];
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

  const SEMIS_AND_FINAL_TOPS = [SEMI_TOPS[0], FINAL_TOPS[0], SEMI_TOPS[1]];

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
        {/* Inner: scaled to fit, always centered */}
        <div
          style={{
            width: BRACKET_NATURAL_W,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            // When scaled down, shift left so the scaled bracket centres in the container
            // (transform-origin: top center auto-centres within the natural width,
            //  but we need the natural-width div itself centred too)
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
