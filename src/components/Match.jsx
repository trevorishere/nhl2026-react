import TeamButton from './TeamButton';
import { FF } from '../styles/tokens';

export default function Match({ match, picks, onPick, mode, seriesLengths, onSeriesLength }) {
  const teams = match.teams || [null, null];
  const hasLabel = !!match.label;
  const selectedGames = seriesLengths?.[match.id] ?? null;

  return (
    <div className="flex flex-col" style={{ gap: hasLabel ? '8px' : '0' }}>
      {hasLabel && (
        <p
          className="text-[11px] font-bold uppercase text-center"
          style={{
            fontFamily: FF,
            letterSpacing: '0.33px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: '1.4',
            margin: 0,
          }}
        >
          {(() => {
            // Insert <br> after "Western" or "Eastern" in conference labels
            const words = match.label.split(' ');
            const breakIdx = words.findIndex(w => /^(western|eastern)$/i.test(w));
            if (breakIdx >= 0) {
              return <>{words.slice(0, breakIdx + 1).join(' ')}<br />{words.slice(breakIdx + 1).join(' ')}</>;
            }
            return match.label;
          })()}
        </p>
      )}

      {/* Team cards — 1px gap between top and bottom card */}
      <div className="flex flex-col gap-[1px]">
        {teams.map((team, i) => (
          <TeamButton
            key={i}
            team={team}
            matchId={match.id}
            picks={picks}
            onPick={onPick}
            position={i === 0 ? 'top' : 'bottom'}
          />
        ))}
      </div>

      {/* Advanced mode: series length selector
          Figma spec: 8px left, 8px gap label→circles, 10px top, 12px bottom, 6px right
          Only the selected number gets a circle; others are plain text.              */}
      {mode === 'advanced' && (
        <div
          className="flex items-center"
          style={{ paddingLeft: 8, paddingRight: 6, paddingTop: 2, paddingBottom: 12 }}
        >
          {/* GAMES label — 10px Figtree Bold, muted */}
          <span
            style={{
              fontFamily: FF,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              marginRight: 8,
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            GAMES
          </span>

          {/* 4 · 5 · 6 · 7  — selected gets filled circle, others plain text */}
          <div className="flex items-center" style={{ gap: 4 }}>
            {[4, 5, 6, 7].map((n) => {
              const selected = selectedGames === n;
              return (
                <button
                  key={n}
                  onClick={() => onSeriesLength(match.id, n)}
                  className="cursor-pointer flex items-center justify-center transition-colors"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: 'none',
                    padding: 0,
                    background: selected ? 'var(--primary)' : 'transparent',
                    color: selected ? '#fff' : 'rgba(255,255,255,0.45)',
                    fontFamily: FF,
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
