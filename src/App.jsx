import { useState, useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import Bracket from './components/Bracket';
import MobileBracket from './components/MobileBracket';
import PlayerTable from './components/PlayerTable';
import PlayerDetailPanel from './components/PlayerDetailPanel';
import Toggle from './components/Toggle';
import { CHALK_PICKS, PICK_DEPS } from './data/constants';
import { FF, C, ctrlBtnStyle } from './styles/tokens';

export default function App() {
  const [picks, setPicks] = useState({});
  const [mode, setMode] = useState('normal');
  const [seriesLengths, setSeriesLengths] = useState({});
  const [selectedPlayer,  setSelectedPlayer]  = useState(null); // for row highlight
  const [panelPlayer,    setPanelPlayer]    = useState(null);   // player in DOM (lingers during close)
  const [panelIn,        setPanelIn]        = useState(false);  // CSS open state
  const [contentVisible, setContentVisible] = useState(true);   // content crossfade
  const panelTimerRef   = useRef(null);
  const contentTimerRef = useRef(null);
  const tableCardRef    = useRef(null);
  const modeInitRef     = useRef(false);
  const [injuries, setInjuries] = useState({});

  // Animate table card on advanced mode toggle (skip initial render)
  useEffect(() => {
    if (!modeInitRef.current) { modeInitRef.current = true; return; }
    const el = tableCardRef.current;
    if (!el) return;
    el.classList.remove('table-mode-on', 'table-mode-off');
    void el.offsetWidth; // force reflow so animation restarts
    el.classList.add(mode === 'advanced' ? 'table-mode-on' : 'table-mode-off');
  }, [mode]);

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
    if (panelTimerRef.current)  clearTimeout(panelTimerRef.current);
    if (contentTimerRef.current) clearTimeout(contentTimerRef.current);

    if (player) {
      if (panelIn) {
        // Panel already open — crossfade content: fade out, swap, fade in
        setSelectedPlayer(player);
        setContentVisible(false);
        contentTimerRef.current = setTimeout(() => {
          setPanelPlayer(player);
          setContentVisible(true);
        }, 150); // half of 300ms total
      } else {
        // Fresh open: mount immediately, then trigger CSS enter
        setSelectedPlayer(player);
        setPanelPlayer(player);
        setContentVisible(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setPanelIn(true)));
      }
    } else {
      // Close: start CSS exit, then unmount after transition completes
      setSelectedPlayer(null);
      setPanelIn(false);
      setContentVisible(true); // reset for next open
      panelTimerRef.current = setTimeout(() => setPanelPlayer(null), 430);
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
    <div style={{ position: 'relative' }}>
      {/* Background texture — natural size, centered at top */}
      <img
        src={`${import.meta.env.BASE_URL}bg-top.jpg`}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1440,
          height: 'auto',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0,
          display: 'block',
        }}
      />
    <div className="max-w-[1600px] mx-auto sm:px-6 py-6" style={{ position: 'relative', zIndex: 1, overflowX: 'hidden' }}>
      {/* Header */}
      <header className="mb-8 px-4 sm:px-0" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Left decorative line */}
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />

        {/* Centered title block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <img
            src={`${import.meta.env.BASE_URL}header.svg`}
            alt="NHL Playoffs '26 Draft Guide"
            style={{ width: isMobile ? 180 : 274, height: isMobile ? 49 : 74, display: 'block' }}
          />
        </div>

        {/* Right decorative line */}
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
      </header>

      {/* Main grid */}
      <div className="flex flex-col gap-5">
        {/* Bracket section — mobile gets its own experience, desktop gets full bracket */}
        <section className="bracket-section pt-2">

          {/* ── Mobile bracket (< sm) ─────────────────────────────────────── */}
          {isMobile && (
            <MobileBracket
              picks={picks}
              onPick={makePick}
              onReset={resetBracket}
            />
          )}

          {/* ── Desktop bracket (≥ sm) ────────────────────────────────────── */}
          {!isMobile && (
            <div style={{ maxWidth: 1232, margin: '0 auto' }}>
              {/* Controls bar */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
                <button
                  style={ctrlBtnStyle(resetHover, { gap: 6, padding: '0 16px 0 14px' })}
                  onClick={resetBracket}
                  onMouseEnter={() => setResetHover(true)}
                  onMouseLeave={() => setResetHover(false)}
                >
                  <RotateCcw size={14} color="currentColor" strokeWidth={2} />
                  Reset
                </button>
                <button
                  style={ctrlBtnStyle(autopickHover, { padding: '0 18px' })}
                  onClick={autoPick}
                  onMouseEnter={() => setAutopickHover(true)}
                  onMouseLeave={() => setAutopickHover(false)}
                >
                  Autopick Favorites
                </button>
                <Toggle
                  on={isAdvanced}
                  onChange={() => setMode(isAdvanced ? 'normal' : 'advanced')}
                />
              </div>

              {/* Bracket */}
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
          )}
        </section>

        {/* Player rankings — #212123 card floats on app bg with 48px padding around it */}
        <section style={{ padding: isMobile ? 0 : '0 48px 48px', marginTop: 24 }}>
          <div ref={tableCardRef} style={{ maxWidth: 1232, margin: '0 auto', width: '100%', background: '#212224', padding: isMobile ? '32px 16px 32px' : '48px 48px 56px' }}>
          <div className="flex items-start" style={{ gap: 48 }}>
            {/* Table — shrinks when desktop panel is open */}
            <div
              className={panelPlayer && !isMobile ? 'flex-1 min-w-0' : 'w-full'}
              style={{ transition: 'flex 420ms cubic-bezier(0.4, 0, 0.2, 1), width 420ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              <PlayerTable
                picks={picks}
                mode={mode}
                seriesLengths={seriesLengths}
                onPlayerSelect={handlePlayerSelect}
                selectedPlayer={selectedPlayer}
                injuries={injuries}
                isMobile={isMobile}
              />
            </div>

            {/* Desktop detail panel — slides in from the right */}
            {panelPlayer && !isMobile && (
              <div
                className="flex-shrink-0 sticky top-4 overflow-hidden"
                style={{
                  width:      panelIn ? 360 : 0,
                  transition: 'width 420ms cubic-bezier(0.4, 0, 0.2, 1)',
                  willChange: 'width',
                }}
              >
                <div style={{
                  width:      360,
                  opacity:    panelIn ? 1 : 0,
                  transform:  panelIn ? 'translateX(0)' : 'translateX(120px)',
                  transition: 'opacity 360ms cubic-bezier(0.4, 0, 0.2, 1), transform 420ms cubic-bezier(0.16, 1, 0.3, 1)',
                  willChange: 'transform, opacity',
                }}>
                  <PlayerDetailPanel
                    player={panelPlayer}
                    injuries={injuries}
                    onClose={() => handlePlayerSelect(null)}
                    contentVisible={contentVisible}
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
                transition: 'opacity 420ms cubic-bezier(0.4, 0, 0.2, 1)',
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
                transition: 'transform 420ms cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '12px 12px 0 0',
                background: '#262829',  // matches desktop panel surface color
              }}
            >
              <PlayerDetailPanel
                player={panelPlayer}
                injuries={injuries}
                onClose={() => handlePlayerSelect(null)}
                contentVisible={contentVisible}
              />
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
