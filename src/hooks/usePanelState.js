import { useState, useRef, useCallback } from 'react';

/**
 * Manages the player-detail panel's open/close animation state machine.
 *
 * Returns:
 *   selectedPlayer  — the highlighted row (immediate)
 *   panelPlayer     — the player mounted in the DOM (lingers during close animation)
 *   panelIn         — CSS open state (drives transform/width transitions)
 *   contentVisible  — crossfade flag when switching players mid-open
 *   handlePlayerSelect(player | null) — call with a player to open/switch, null to close
 */
export function usePanelState() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [panelPlayer,    setPanelPlayer]    = useState(null);
  const [panelIn,        setPanelIn]        = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  const panelTimerRef   = useRef(null);
  const contentTimerRef = useRef(null);

  const handlePlayerSelect = useCallback((player) => {
    if (panelTimerRef.current)   clearTimeout(panelTimerRef.current);
    if (contentTimerRef.current) clearTimeout(contentTimerRef.current);

    if (player) {
      if (panelIn) {
        // Panel already open — crossfade: fade out, swap, fade in
        setSelectedPlayer(player);
        setContentVisible(false);
        contentTimerRef.current = setTimeout(() => {
          setPanelPlayer(player);
          setContentVisible(true);
        }, 150);
      } else {
        // Fresh open: mount immediately, then trigger CSS enter
        setSelectedPlayer(player);
        setPanelPlayer(player);
        setContentVisible(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setPanelIn(true)));
      }
    } else {
      // Close: CSS exit, then unmount after transition completes
      setSelectedPlayer(null);
      setPanelIn(false);
      setContentVisible(true);
      panelTimerRef.current = setTimeout(() => setPanelPlayer(null), 430);
    }
  }, [panelIn]);

  return { selectedPlayer, panelPlayer, panelIn, contentVisible, handlePlayerSelect };
}
