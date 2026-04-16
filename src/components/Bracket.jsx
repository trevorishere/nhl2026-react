import BracketColumn from './BracketColumn';
import { ROUND1_MATCHUPS } from '../data/constants';

// ─── Card dimensions ──────────────────────────────────────────────────────────
const CARD_W = 156;         // each team card width
const MATCH_H_NORMAL   = 117; // 58 + 1px gap + 58  (no game selector)
const MATCH_H_ADVANCED = 161; // 117 + 44px game-selector block

// ─── Vertical layout — from Figma frame 93:86555 (1440w) ─────────────────────
//
// R1 match positions taken directly from Figma: uniform 197px spacing.
// Semi/Final tops are hardcoded from Figma container y values.
// Same anchor positions for BOTH modes; advanced just adds game-selector height.
//
const R1_TOPS = [0, 197, 394, 591];

// Semis: from Figma y positions of the R2 label containers
const SEMI_TOP_0 = 91;   // Figma y=90.5
const SEMI_TOP_1 = 478;  // Figma y=477.5

// Conference Finals: from Figma y positions of WCF/ECF label containers
const LABEL_H      = 19; // single-line label height (R2, Cup Final)
const CONF_LABEL_H = 38; // two-line conf-final label height
const FINAL_TOP    = 275; // Figma WCF y=274.5

// Cup Final: from Figma y position of Cup label container
const CUP_TOP = 284; // Figma y=283.5

const SEMIS_AND_FINAL_TOPS = [SEMI_TOP_0, FINAL_TOP, SEMI_TOP_1];
const CUP_TOPS = [CUP_TOP];

// ─── Column widths ────────────────────────────────────────────────────────────
//
//  R1 col        : 156px — exactly one card wide
//  Semis+Final   : 307px — semi at left=40, conf-final at left=151 (156+307=463)
//  Cup Final     : 306px — card centred at left=75 (75+156=231, centre of 306px)
//  No column gap — spacing is built into the left offsets within each column
//
//  Natural bracket width = 156+307+306+307+156 = 1232px (Figma frame 93:86555)
//
// West: semis fixed 40px from left edge; WCF right-aligned to column
const WEST_SEMIS_LEFTS = [40, 'calc(100% - 156px)', 40];
// East: ECF left-aligned at 0; semis have fixed 40px right margin
const EAST_SEMIS_LEFTS = ['calc(100% - 196px)', 0, 'calc(100% - 196px)'];

// ─────────────────────────────────────────────────────────────────────────────

export default function Bracket({ picks, onPick, mode, seriesLengths, onSeriesLength }) {
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
    <div style={{ position: 'relative' }}>
      {/* Bracket grid — fluid width, no scaling */}
      <div className="bracket-grid" style={{ height: COL_H }}>
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
          lefts={['calc(50% - 78px)']}
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

        {/* Champion pill — anchored to CUP_TOP, 24px gap below */}
        {champ && (
          <div style={{
            position: 'absolute',
            top: CUP_TOP,
            left: '50%',
            transform: 'translateX(-50%) translateY(-100%)',
            paddingBottom: 24,
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}>
            <span className="inline-flex items-center gap-2 bg-surface2 border border-border px-3 py-2 rounded-full text-[14px] font-bold text-primary">
              {champ} wins the Cup!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
