import { useState, useEffect } from 'react';
import Bracket from './components/Bracket';
import PlayerTable from './components/PlayerTable';
import PlayerDetailPanel from './components/PlayerDetailPanel';
import { CHALK_PICKS, PICK_DEPS } from './data/constants';

export default function App() {
  const [picks, setPicks] = useState({});
  const [mode, setMode] = useState('normal');
  const [seriesLengths, setSeriesLengths] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  function makePick(matchId, team) {
    setPicks((prev) => {
      const next = { ...prev };
      // cascade-delete dependent picks
      (PICK_DEPS[matchId] || []).forEach((dep) => delete next[dep]);
      next[matchId] = team;
      return next;
    });
  }

  function setSeriesLength(matchId, games) {
    setSeriesLengths((prev) => ({ ...prev, [matchId]: games }));
  }

  function resetBracket() {
    setPicks({});
    setSeriesLengths({});
  }

  function autoPick() {
    setPicks(CHALK_PICKS);
  }

  const btnBase =
    'border border-border bg-surface px-3.5 py-2.5 rounded-full cursor-pointer text-app-text text-sm font-medium hover:opacity-80 transition-opacity';
  const btnPrimary =
    'border border-primary bg-primary px-3.5 py-2.5 rounded-full cursor-pointer text-white text-sm font-medium hover:opacity-90 transition-opacity';

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      {/* Header */}
      <header className="flex justify-between items-center gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-[clamp(28px,4vw,42px)] font-bold m-0 text-app-text">
            Playoff points projector
          </h1>
          <p className="text-muted max-w-[80ch] mt-1 text-sm">
            Pick each series winner and the tool recalculates expected games, then ranks every
            skater on the 16 playoff-position teams by projected playoff points. Teams are based on
            the current playoff picture as of April 9, 2026.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <button className={btnBase} onClick={resetBracket}>
            Reset bracket
          </button>
          <button className={btnPrimary} onClick={autoPick}>
            Auto-pick favorites
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div className="flex flex-col gap-5">
        {/* Bracket card */}
        <section className="bg-surface border border-border rounded-card shadow-card p-4">
          {/* Normal / Advanced toggle */}
          <div className="flex gap-2 mb-4">
            <button
              className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                mode === 'normal'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-surface border-border text-app-text hover:opacity-80'
              }`}
              onClick={() => setMode('normal')}
            >
              Normal
            </button>
            <button
              className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                mode === 'advanced'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-surface border-border text-app-text hover:opacity-80'
              }`}
              onClick={() => setMode('advanced')}
            >
              Advanced
            </button>
          </div>
          <Bracket
            picks={picks}
            onPick={makePick}
            mode={mode}
            seriesLengths={seriesLengths}
            onSeriesLength={setSeriesLength}
          />
        </section>

        {/* Player rankings card */}
        <section className="bg-surface border border-border rounded-card shadow-card p-4">
          <h2 className="text-[18px] font-bold m-0 mb-3 text-app-text">Player rankings</h2>
          <div className="flex gap-6 items-start">
            {/* Table — shrinks when panel is open */}
            <div className={selectedPlayer ? 'flex-1 min-w-0' : 'w-full'}>
              <PlayerTable
                picks={picks}
                mode={mode}
                seriesLengths={seriesLengths}
                onPlayerSelect={setSelectedPlayer}
                selectedPlayer={selectedPlayer}
              />
            </div>
            {/* Detail panel — 320px, appears inline */}
            {selectedPlayer && (
              <div className="w-80 flex-shrink-0 sticky top-4">
                <PlayerDetailPanel
                  player={selectedPlayer}
                  onClose={() => setSelectedPlayer(null)}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
