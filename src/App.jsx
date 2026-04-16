import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import Bracket from './components/Bracket';
import PlayerTable from './components/PlayerTable';
import PlayerDetailPanel from './components/PlayerDetailPanel';
import { CHALK_PICKS, PICK_DEPS } from './data/constants';

export default function App() {
  const [picks, setPicks] = useState({});
  const [mode, setMode] = useState('normal');
  const [seriesLengths, setSeriesLengths] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [injuries, setInjuries] = useState({});

  useEffect(() => {
    fetch('/injuries.json')
      .then((r) => r.json())
      .then((d) => setInjuries(d.players || {}))
      .catch(() => {}); // silently fail if file not yet generated
  }, []);

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

  const isAdvanced = mode === 'advanced';
  const [resetHover, setResetHover] = useState(false);
  const [autopickHover, setAutopickHover] = useState(false);

  // Shared button style matching Figma: rgba(57,56,54,0.4) bg, no radius, Bold 13px uppercase
  function ctrlBtn(hovering) {
    return {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: 40,
      background: hovering ? 'rgba(57,56,54,0.6)' : 'rgba(57,56,54,0.4)',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'Figtree, sans-serif',
      fontSize: 13,
      fontWeight: 700,
      color: '#e7e4df',
      letterSpacing: '0.65px',
      textTransform: 'uppercase',
      padding: '0 16px',
      whiteSpace: 'nowrap',
      transition: 'background 0.15s ease',
    };
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      {/* Header — centered title + subtitle */}
      <header className="text-center mb-8">
        <h1 style={{
          fontFamily: 'Figtree, sans-serif',
          fontSize: 32,
          fontWeight: 600,
          color: '#e7e4df',
          letterSpacing: '0.32px',
          margin: 0,
          lineHeight: '27px',
        }}>
          NHL Playoffs Draft Guide 2026
        </h1>
        <p style={{
          fontFamily: 'Figtree, sans-serif',
          fontSize: 16,
          fontWeight: 500,
          color: '#a09d96',
          letterSpacing: '0.32px',
          marginTop: 12,
          lineHeight: '21px',
        }}>
          Pick the winner in each series. Get your top picks.
        </p>
      </header>

      {/* Main grid */}
      <div className="flex flex-col gap-5">
        {/* Bracket — no card wrapper, sits on bare background */}
        <section className="px-20 pt-2">
          <div style={{ maxWidth: 1232, minWidth: 988 }}>

          {/* Controls bar: Reset + Autopick (centered) | Advanced Mode toggle (right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', height: 40, marginBottom: 32 }}>
            {/* Left: empty spacer */}
            <div />

            {/* Center: action buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                style={ctrlBtn(resetHover)}
                onClick={resetBracket}
                onMouseEnter={() => setResetHover(true)}
                onMouseLeave={() => setResetHover(false)}
              >
                <RotateCcw size={14} color="#e7e4df" strokeWidth={2} />
                Reset
              </button>
              <button
                style={ctrlBtn(autopickHover)}
                onClick={autoPick}
                onMouseEnter={() => setAutopickHover(true)}
                onMouseLeave={() => setAutopickHover(false)}
              >
                Autopick Favorites
              </button>
            </div>

            {/* Right: Advanced Mode toggle */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'Figtree, sans-serif',
                fontSize: 11,
                fontWeight: 600,
                color: '#e7e4df',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                Advanced Mode
              </span>
              {/* Toggle switch */}
              <div
                onClick={() => setMode(isAdvanced ? 'normal' : 'advanced')}
                style={{
                  cursor: 'pointer',
                  background: isAdvanced ? '#4e4e4e' : '#484848',
                  height: 24,
                  width: 64,
                  borderRadius: 9,
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'background 0.2s ease',
                }}
              >
                {/* Knob */}
                <div style={{
                  position: 'absolute',
                  background: isAdvanced ? '#e7e4df' : '#a09d96',
                  height: 16,
                  width: 28,
                  borderRadius: 7,
                  top: 4,
                  left: isAdvanced ? 31 : 5,
                  transition: 'left 0.2s ease, background 0.2s ease',
                }} />
                {/* ON label — left side, fades in when ON */}
                <div style={{
                  position: 'absolute',
                  left: 9,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: 'Figtree, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: '#e7e4df',
                  opacity: isAdvanced ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}>
                  ON
                </div>
                {/* OFF label — right side, fades out when ON */}
                <div style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: 'Figtree, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: '#e7e4df',
                  opacity: isAdvanced ? 0 : 0.57,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}>
                  OFF
                </div>
              </div>
            </div>
          </div>

          <Bracket
            picks={picks}
            onPick={makePick}
            mode={mode}
            seriesLengths={seriesLengths}
            onSeriesLength={setSeriesLength}
          />
          </div>
        </section>

        {/* Player rankings */}
        <section className="px-20 pt-2">
          <div style={{ maxWidth: 1232, minWidth: 988 }}>
          <div className="flex gap-6 items-start">
            {/* Table — shrinks when panel is open */}
            <div className={selectedPlayer ? 'flex-1 min-w-0' : 'w-full'}>
              <PlayerTable
                picks={picks}
                mode={mode}
                seriesLengths={seriesLengths}
                onPlayerSelect={setSelectedPlayer}
                selectedPlayer={selectedPlayer}
                injuries={injuries}
              />
            </div>
            {/* Detail panel — 320px, appears inline */}
            {selectedPlayer && (
              <div className="w-80 flex-shrink-0 sticky top-4">
                <PlayerDetailPanel
                  player={selectedPlayer}
                  injuries={injuries}
                  onClose={() => setSelectedPlayer(null)}
                />
              </div>
            )}
          </div>
          </div>
        </section>
      </div>
    </div>
  );
}
