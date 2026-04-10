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
      {/* Two team cards with 2px gap */}
      <div className="flex flex-col gap-[2px]">
        {teams.map((team, i) => (
          <TeamButton
            key={i}
            team={team}
            matchId={match.id}
            isFirst={i === 0}
            picks={picks}
            onPick={onPick}
          />
        ))}
      </div>
      {/* Advanced mode: series length selector */}
      {mode === 'advanced' && (
        <div className="flex justify-center gap-1 mt-2">
          {[4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => onSeriesLength(match.id, n)}
              className={`text-[11px] font-bold w-7 h-6 rounded-md transition-colors cursor-pointer ${
                selectedGames === n
                  ? 'bg-primary text-white'
                  : 'bg-surface2 text-muted hover:text-app-text'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
