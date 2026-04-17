import { useState, useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import Bracket from './components/Bracket';
import PlayerTable from './components/PlayerTable';
import PlayerDetailPanel from './components/PlayerDetailPanel';
import Toggle from './components/Toggle';
import { CHALK_PICKS, PICK_DEPS } from './data/constants';
import { FF, C, T, ctrlBtnStyle } from './styles/tokens';

export default function App() {
  const [picks, setPicks] = useState({});
  const [mode, setMode] = useState('normal');
  const [seriesLengths, setSeriesLengths] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null); // for row highlight
  const [panelPlayer,   setPanelPlayer]   = useState(null);   // player in DOM (lingers during close)
  const [panelIn,       setPanelIn]       = useState(false);   // CSS open state
  const panelTimerRef = useRef(null);
  const [injuries, setInjuries] = useState({});

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}injuries.json`)
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

  function handlePlayerSelect(player) {
    if (panelTimerRef.current) clearTimeout(panelTimerRef.current);

    if (player) {
      // Open (or switch player): mount immediately, then trigger CSS enter
      setSelectedPlayer(player);
      setPanelPlayer(player);
      requestAnimationFrame(() => requestAnimationFrame(() => setPanelIn(true)));
    } else {
      // Close: start CSS exit, then unmount after transition completes
      setSelectedPlayer(null);
      setPanelIn(false);
      panelTimerRef.current = setTimeout(() => setPanelPlayer(null), 310);
    }
  }

  const isAdvanced = mode === 'advanced';
  const [resetHover, setResetHover] = useState(false);
  const [autopickHover, setAutopickHover] = useState(false);

  // Responsive: detect mobile (< 640px = Tailwind sm breakpoint)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <header className="mb-8" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Left decorative line */}
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />

        {/* Centered title block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <img
            src={`${import.meta.env.BASE_URL}header.svg`}
            alt="NHL Playoffs '26 Draft Guide"
            style={{ width: 274, height: 74, display: 'block' }}
          />
        </div>

        {/* Right decorative line */}
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
      </header>

      {/* Main grid */}
      <div className="flex flex-col gap-5">
        {/* Bracket — no card wrapper, sits on bare background */}
        <section className="bracket-section pt-2">
          <div style={{ maxWidth: 1232, margin: '0 auto' }}>

          {/* Controls bar: Reset + Autopick (centered) | Advanced Mode toggle (right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', height: 40, marginBottom: 32 }}>
            {/* Left: empty spacer */}
            <div />

            {/* Center: action buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                style={ctrlBtnStyle(resetHover, { gap: 6, padding: '0 16px' })}
                onClick={resetBracket}
                onMouseEnter={() => setResetHover(true)}
                onMouseLeave={() => setResetHover(false)}
              >
                <RotateCcw size={14} color={C.text} strokeWidth={2} />
                Reset
              </button>
              <button
                style={ctrlBtnStyle(autopickHover, { padding: '0 16px' })}
                onClick={autoPick}
                onMouseEnter={() => setAutopickHover(true)}
                onMouseLeave={() => setAutopickHover(false)}
              >
                Autopick Favorites
              </button>
            </div>

            {/* Right: Advanced Mode toggle */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
              <span style={T.label}>Advanced Mode</span>
              <Toggle
                on={isAdvanced}
                onChange={() => setMode(isAdvanced ? 'normal' : 'advanced')}
              />
            </div>
          </div>

          {/* Scroll container: scrolls horizontally on mobile, full bracket on desktop */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginLeft: -12, marginRight: -12 }}>
            <div style={{ minWidth: 988, paddingLeft: 12, paddingRight: 12 }}>
              <Bracket
                picks={picks}
                onPick={makePick}
                mode={mode}
                seriesLengths={seriesLengths}
                onSeriesLength={setSeriesLength}
              />
            </div>
          </div>
          </div>
        </section>

        {/* Player rankings */}
        <section className="sm:px-20" style={{ paddingTop: 64 }}>
          <div style={{ maxWidth: 1232, margin: '0 auto' }}>

          {/* Draft List title — Figma 181:4407 */}
          <h2 style={{
            fontFamily: FF, fontSize: 32, fontWeight: 700,
            color: C.text, letterSpacing: '0.64px',
            textAlign: 'center', marginBottom: 40, marginTop: 0,
          }}>
            Draft List
          </h2>
          <div className="flex items-start" style={{ gap: 48 }}>
            {/* Table — shrinks when desktop panel is open */}
            <div className={panelPlayer && !isMobile ? 'flex-1 min-w-0' : 'w-full'}>
              <PlayerTable
                picks={picks}
                mode={mode}
                seriesLengths={seriesLengths}
                onPlayerSelect={handlePlayerSelect}
                selectedPlayer={selectedPlayer}
                injuries={injuries}
              />
            </div>

            {/* Desktop detail panel — width animates 0→336 to push the table */}
            {panelPlayer && !isMobile && (
              <div
                className="flex-shrink-0 sticky top-4 overflow-hidden"
                style={{
                  width:      panelIn ? 336 : 0,
                  transition: 'width 300ms ease-in-out',
                }}
              >
                <div style={{
                  width:      336,
                  opacity:    panelIn ? 1 : 0,
                  transform:  panelIn ? 'translateX(0)' : 'translateX(20px)',
                  transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out',
                }}>
                  <PlayerDetailPanel
                    player={panelPlayer}
                    injuries={injuries}
                    onClose={() => handlePlayerSelect(null)}
                  />
                </div>
              </div>
            )}
          </div>
          </div>
        </section>

        {/* Mobile detail panel — slides up from bottom */}
        {panelPlayer && isMobile && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => handlePlayerSelect(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                background: 'rgba(0,0,0,0.5)',
                opacity:    panelIn ? 1 : 0,
                transition: 'opacity 300ms ease-in-out',
              }}
            />
            {/* Sheet */}
            <div
              style={{
                position:   'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex:     50,
                maxHeight:  '85vh',
                overflowY:  'auto',
                transform:  panelIn ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 300ms ease-in-out',
                borderRadius: '12px 12px 0 0',
                background: '#232221',  // solid page bg — matches desktop panel appearance
              }}
            >
              <PlayerDetailPanel
                player={panelPlayer}
                injuries={injuries}
                onClose={() => handlePlayerSelect(null)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
