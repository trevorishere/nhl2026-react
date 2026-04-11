import TeamButton from './TeamButton';

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
            fontFamily: 'Figtree, sans-serif',
            letterSpacing: '0.33px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 'normal',
            margin: 0,
          }}
        >
          {match.label}
        </p>
      )}

      {/* Outer card wraps both team cards + advanced selector */}
      <div className="flex flex-col rounded-[2px] overflow-hidden">
        {/* Two team cards with 2px gap */}
        <div className="flex flex-col gap-[2px]">
          {teams.map((team, i) => (
            <TeamButton
              key={i}
              team={team}
              matchId={match.id}
              picks={picks}
              onPick={onPick}
            />
          ))}
        </div>

        {/* Advanced mode: series length selector — matches Figma layout */}
        {mode === 'advanced' && (
          <div
            className="flex items-center"
            style={{
              background: 'rgba(255,255,255,0.07)',
              paddingLeft: 8,
              paddingRight: 6,
              paddingTop: 10,
              paddingBottom: 12,
              gap: 0,
            }}
          >
            {/* GAMES label */}
            <span
              style={{
                fontFamily: 'Figtree, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
                marginRight: 8,
                flexShrink: 0,
              }}
            >
              GAMES
            </span>

            {/* Circle buttons — 22px, evenly spaced */}
            <div className="flex items-center" style={{ gap: 0, flex: 1, justifyContent: 'space-between' }}>
              {[4, 5, 6, 7].map((n) => (
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
                    background: selectedGames === n ? 'var(--primary)' : 'rgba(255,255,255,0.12)',
                    color: selectedGames === n ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'Figtree, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
