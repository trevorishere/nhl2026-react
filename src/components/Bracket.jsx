import BracketColumn from './BracketColumn';
import { ROUND1_MATCHUPS } from '../data/constants';

// ─── Card dimensions ──────────────────────────────────────────────────────────
const CARD_W = 168;           // each team card width (Figma 206:17206)
const MATCH_H_NORMAL   = 117; // 58 + 1px gap + 58
const MATCH_H_ADVANCED = 161; // 117 + 44px game-selector block

// ─── Vertical layout — from Figma frame 206:17206 (1200w) ────────────────────
//
// R1 match tops: uniform 189px spacing (was 197px in old Figma).
// Semi/Final tops come from the Figma container y values.
// Bottom semis (S2/S4) have no label — buttons sit flush at top of container.
//
const R1_TOPS = [0, 189, 378, 567];

// Top semis: label "R2" above buttons — container at y=70.5
const SEMI_TOP_0 = 70;

// Bottom semis: no label, buttons at y=474.5
const SEMI_TOP_1 = 474;

// Conference Finals: two-line label above buttons — container at y=265.5
const FINAL_TOP = 266;

// Cup Final: single-line label above buttons — container at y=269
const CUP_TOP = 269;

// Stanley Cup SVG sits above the Cup Final match in the centre column
const CUP_SVG_TOP = 128;

const SEMIS_AND_FINAL_TOPS = [SEMI_TOP_0, FINAL_TOP, SEMI_TOP_1];
const CUP_TOPS = [CUP_TOP];

// ─── Column layout ────────────────────────────────────────────────────────────
//
//  Natural bracket width = 168+286+292+286+168 = 1200px (Figma frame 206:17206)
//
//  West: top+bottom semis at left=32; WCF flush-right (left=calc(100%-168px)=118px)
//  East: ECF flush-left (left=0);    top+bottom semis at left=86
//
// West: semis 32px from left edge; WCF flush-right
const WEST_SEMIS_LEFTS = [32, 'calc(100% - 168px)', 32];
// East: ECF flush-left; semis 32px from right edge (calc(100% - 168px - 32px))
const EAST_SEMIS_LEFTS = ['calc(100% - 200px)', 0, 'calc(100% - 200px)'];

// ─────────────────────────────────────────────────────────────────────────────

export default function Bracket({ picks, onPick, mode, seriesLengths, onSeriesLength }) {
  const matchH = mode === 'advanced' ? MATCH_H_ADVANCED : MATCH_H_NORMAL;
  const COL_H  = R1_TOPS[3] + matchH + 20;

  const r1 = ROUND1_MATCHUPS;
  const getPick = (id) => picks[id] || null;

  const westR1 = r1.filter((m) => m.id.startsWith('W')).map((m) => ({ ...m, label: '' }));
  const eastR1 = r1.filter((m) => m.id.startsWith('E')).map((m) => ({ ...m, label: '' }));

  const semis = [
    { id: 'S1', teams: [getPick('E1'), getPick('E2')], label: 'R2' }, // top east semi
    { id: 'S2', teams: [getPick('E3'), getPick('E4')], label: ''   }, // bottom east semi — no label
    { id: 'S3', teams: [getPick('W1'), getPick('W2')], label: 'R2' }, // top west semi
    { id: 'S4', teams: [getPick('W3'), getPick('W4')], label: ''   }, // bottom west semi — no label
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
      <div className="bracket-grid" style={{ height: COL_H, position: 'relative' }}>
        {/* Col 1: West R1 */}
        <BracketColumn matches={westR1} tops={R1_TOPS} colHeight={COL_H} {...columnProps} />

        {/* Col 2: West Semis + Conference Final */}
        <BracketColumn matches={westSemisAndFinal} tops={SEMIS_AND_FINAL_TOPS} lefts={WEST_SEMIS_LEFTS} colHeight={COL_H} {...columnProps} />

        {/* Col 3: Stanley Cup SVG + Cup Final */}
        <div style={{ position: 'relative', height: COL_H }}>
          {/* Stanley Cup trophy */}
          <img
            src={`${import.meta.env.BASE_URL}stcup.svg`}
            alt="Stanley Cup"
            style={{
              position: 'absolute',
              top: CUP_SVG_TOP,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 68,
              height: 101,
              objectFit: 'contain',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
          <BracketColumn matches={[cup]} tops={CUP_TOPS} lefts={['calc(50% - 84px)']} colHeight={COL_H} {...columnProps} />

          {/* Champion pill — appears below cup buttons once a winner is picked */}
          {champ && (
            <div style={{
              position: 'absolute',
              top: CUP_TOP + matchH + 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}>
              <span className="inline-flex items-center gap-2 bg-surface2 border border-border px-3 py-2 rounded-full text-[14px] font-bold text-primary">
                {champ} wins the Cup!
              </span>
            </div>
          )}
        </div>

        {/* Col 4: East Semis + Conference Final */}
        <BracketColumn matches={eastSemisAndFinal} tops={SEMIS_AND_FINAL_TOPS} lefts={EAST_SEMIS_LEFTS} colHeight={COL_H} {...columnProps} />

        {/* Col 5: East R1 */}
        <BracketColumn matches={eastR1} tops={R1_TOPS} colHeight={COL_H} {...columnProps} />
      </div>
    </div>
  );
}
