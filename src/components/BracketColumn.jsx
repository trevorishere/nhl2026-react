import Match from './Match';

export default function BracketColumn({ matches, picks, onPick, tops, lefts, colHeight, mode, seriesLengths, onSeriesLength }) {
  return (
    <div className="relative" style={{ height: colHeight }}>
      {matches.map((m, i) => (
        <div key={m.id} className="absolute w-[168px]" style={{ top: tops[i], left: lefts?.[i] ?? 0 }}>
          <Match match={m} picks={picks} onPick={onPick} mode={mode} seriesLengths={seriesLengths} onSeriesLength={onSeriesLength} />
        </div>
      ))}
    </div>
  );
}
