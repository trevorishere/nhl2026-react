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
            picks={picks}
            onPick={onPick}
          />
        ))}
      </div>

      {/* Advanced mode: series length selector */}
      {mode === 'advanced' && (
        <div className="flex items-center gap-1.5 mt-2 px-1">
          <span
            className="text-[9px] font-bold uppercase tracking-widest mr-0.5"
            style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Figtree, sans-serif' }}
          >
            G
          </span>
          {[4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => onSeriesLength(match.id, n)}
              className={`text-[11px] font-bold w-6 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                selectedGames === n
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80'
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
