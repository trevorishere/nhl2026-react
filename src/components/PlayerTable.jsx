import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, GripVertical, AlertCircle, ChevronDown, ListFilter, Check, Download } from 'lucide-react';
import { BASE_DATA } from '../data/players';
import { CHALK_PICKS, ROUND1_MATCHUPS, ROUND_PROGRESSION } from '../data/constants';
import { getPosition } from '../data/positions';
import { FF, C, T, ctrlBtnStyle, dropItemBase, dropPanel } from '../styles/tokens';
import {
  DndContext, closestCenter,
  PointerSensor, KeyboardSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ─── Shared class strings ──────────────────────────────────────────────────────
const TD = 'px-2 h-[48px] border-b border-border'; // base table cell

const LS_KEY = 'nhl2026-customOrder'; // localStorage key

// ─── Playoff factor by tier ────────────────────────────────────────────────────
function getPlayoffFactor(seasonPPG) {
  if (seasonPPG >= 0.95) return 0.975;
  if (seasonPPG >= 0.56) return 0.90;
  return 0.825;
}

// ─── Expected games ────────────────────────────────────────────────────────────
function calcExpectedGames(team, effectivePicks, seriesLengths, mode) {
  const gamesFor = (id) => mode === 'advanced' ? (seriesLengths[id] ?? 6) : 6;
  const r1 = ROUND1_MATCHUPS.find((m) => m.teams.includes(team));
  if (!r1) return 0;
  let games = gamesFor(r1.id);
  let cur = r1.id;
  while (ROUND_PROGRESSION[cur] && effectivePicks[cur] === team) {
    cur = ROUND_PROGRESSION[cur];
    games += gamesFor(cur);
  }
  return games;
}

// ─── Table column definitions ──────────────────────────────────────────────────
// mobileHide: true → hidden below sm breakpoint (640px)
const COLUMNS = [
  { key: '#',                    label: '#',          sortable: false, align: 'left',  width: '4%'  },
  { key: 'name',                 label: 'Player',     sortable: true,  align: 'left',  width: '40%' },
  { key: 'team',                 label: 'Team',       sortable: true,  align: 'left',  width: '10%', mobileHide: true },
  { key: 'pos',                  label: 'Pos',        sortable: true,  align: 'left',  width: '10%', mobileHide: true },
  { key: 'SeasonPPG',            label: 'Season PPG', sortable: true,  align: 'right', defaultDir: 'desc', width: '12%', mobileHide: true },
  { key: 'dynamicPoints',        label: 'Proj Pts',   sortable: true,  align: 'right', defaultDir: 'desc', width: '12%' },
  { key: 'dynamicExpectedGames', label: 'Proj Games', sortable: true,  align: 'right', defaultDir: 'desc', width: '12%', mobileHide: true },
];

// ─── Unique stable ID per player ───────────────────────────────────────────────
const rowId = (p) => p.name + '|' + p.team;

// ─── Injury lookup helpers ─────────────────────────────────────────────────────
function normalizeName(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}
function getInjury(playerName, injuries) {
  return injuries[normalizeName(playerName)] ?? null;
}

// ─── Sortable row sub-component ───────────────────────────────────────────────
function SortableRow({ player, globalRank, editMode, injuries }) {
  const id = rowId(player);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editMode,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 'auto',
  };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
      {editMode && (
        <td
          className="px-2 py-2.5 border-b border-border text-muted cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </td>
      )}
      <td className={`${TD} text-muted truncate sm:pl-3`}>{globalRank}</td>
      <td className={`${TD} overflow-hidden`}>
        <span className="flex items-center gap-3 min-w-0">
          <span className="truncate">{player.name}</span>
          {getInjury(player.name, injuries) && (
            <AlertCircle size={16} strokeWidth={1.5} color="#ef4444" style={{ flexShrink: 0 }} />
          )}
        </span>
      </td>
      <td className={`${TD} text-muted truncate hidden sm:table-cell`}>{player.team}</td>
      <td className={`${TD} text-muted truncate hidden sm:table-cell`}>{player.pos}</td>
      <td className={`${TD} text-right truncate hidden sm:table-cell`}>{player.SeasonPPG.toFixed(2)}</td>
      <td className={`${TD} text-primary text-right truncate`}>{player.dynamicPoints.toFixed(1)}</td>
      <td className={`${TD} text-right truncate hidden sm:table-cell sm:pr-3`}>{player.dynamicExpectedGames.toFixed(1)}</td>
    </tr>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function PlayerTable({ picks, mode, seriesLengths, onPlayerSelect, selectedPlayer, injuries = {} }) {
  const [sortConfig, setSortConfig]       = useState({ key: 'dynamicPoints', direction: 'desc' });
  const [hoveredHeader, setHoveredHeader] = useState(null);

  // Edit mode state
  const [editMode, setEditMode]   = useState(false);
  const [filterPos, setFilterPos] = useState('all');
  const [filterTeams, setFilterTeams] = useState(new Set());
  const [teamOpen, setTeamOpen] = useState(false);
  const [posOpen, setPosOpen] = useState(false);
  const [teamBtnHover, setTeamBtnHover] = useState(false);
  const [editBtnHover, setEditBtnHover] = useState(false);
  const [xlsBtnHover, setXlsBtnHover] = useState(false);
  const [resetOrderHover, setResetOrderHover] = useState(false);
  const [posBtnHover, setPosBtnHover] = useState(false);
  const teamDropRef = useRef(null);
  const posDropRef = useRef(null);

  // customOrder: null | string[]  — stores player IDs in the user's chosen order.
  // Storing IDs (not full objects) means projected points always reflect the
  // latest bracket picks even when the order is manually set.
  const [customOrder, setCustomOrder] = useState(null);

  // Read saved order from localStorage once on mount (useState lazy init)
  const [pendingRestoreIds] = useState(() => {
    try {
      const s = localStorage.getItem(LS_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const hasRestored = useRef(false);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleSort(col) {
    setSortConfig((prev) => {
      if (prev.key === col.key) {
        return { key: col.key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: col.key, direction: col.defaultDir ?? 'asc' };
    });
  }

  // ── Auto-ranked rows (always fresh from picks/mode/seriesLengths) ───────────
  const rows = useMemo(() => {
    const effectivePicks = { ...CHALK_PICKS, ...picks };

    const computed = [...BASE_DATA].map((p) => {
      const pos = getPosition(p.name);
      const eg  = calcExpectedGames(p.team, effectivePicks, seriesLengths, mode);
      const pts = p.SeasonPPG * getPlayoffFactor(p.SeasonPPG) * eg;
      return { ...p, pos, dynamicExpectedGames: eg, dynamicPoints: pts };
    });

    computed.sort((a, b) => {
      const { key, direction } = sortConfig;
      const aVal = a[key];
      const bVal = b[key];
      const cmp  = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return direction === 'asc' ? cmp : -cmp;
    });

    return computed;
  }, [picks, mode, seriesLengths, sortConfig]);

  // ── Map of ID → player object (always current) ────────────────────────────
  const rowMap = useMemo(() => new Map(rows.map((p) => [rowId(p), p])), [rows]);

  // ── Restore saved order from localStorage once rowMap is ready ────────────
  useEffect(() => {
    if (pendingRestoreIds && !hasRestored.current && rowMap.size > 0) {
      hasRestored.current = true;
      const validIds = pendingRestoreIds.filter((id) => rowMap.has(id));
      const savedSet = new Set(validIds);
      const newIds   = rows.filter((p) => !savedSet.has(rowId(p))).map(rowId);
      setCustomOrder([...validIds, ...newIds]);
    }
  }, [rowMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist customOrder to localStorage whenever it changes ───────────────
  useEffect(() => {
    if (customOrder !== null) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(customOrder));
      } catch { /* storage full or blocked — fail silently */ }
    }
  }, [customOrder]);

  // ── Edit mode helpers ──────────────────────────────────────────────────────
  function enterEditMode() {
    // If no saved/custom order yet, snapshot the current auto-ranked order
    if (!customOrder) setCustomOrder(rows.map(rowId));
    setEditMode(true);
  }
  function exitEditMode() { setEditMode(false); }

  function resetOrder() {
    const freshIds = rows.map(rowId);
    setCustomOrder(freshIds);
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    setCustomOrder((prev) => {
      const oldIdx = prev.indexOf(active.id);
      const newIdx = prev.indexOf(over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (teamDropRef.current && !teamDropRef.current.contains(e.target)) setTeamOpen(false);
      if (posDropRef.current && !posDropRef.current.contains(e.target)) setPosOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function toggleTeam(team) {
    setFilterTeams((prev) => {
      const next = new Set(prev);
      if (next.has(team)) next.delete(team); else next.add(team);
      return next;
    });
  }

  function selectPos(pos) {
    setFilterPos((prev) => (prev === pos ? 'all' : pos));
    setPosOpen(false);
  }

  // ── Displayed rows ─────────────────────────────────────────────────────────
  // In edit mode: resolve IDs → fresh player objects, then filter.
  // In normal mode: use auto-ranked rows, then filter.
  const baseRows = useMemo(() => {
    if (editMode && customOrder) {
      return customOrder.map((id) => rowMap.get(id)).filter(Boolean);
    }
    return rows;
  }, [editMode, customOrder, rows, rowMap]);

  const displayRows = useMemo(() => baseRows.filter((p) => {
    if (filterTeams.size > 0 && !filterTeams.has(p.team)) return false;
    if (filterPos !== 'all' && p.pos !== filterPos) return false;
    return true;
  }), [baseRows, filterTeams, filterPos]);

  // ── Export helpers ─────────────────────────────────────────────────────────
  // Always export the full ordered list (ignoring active filters).
  function getExportRows() {
    if (customOrder) return customOrder.map((id) => rowMap.get(id)).filter(Boolean);
    return rows;
  }

  function exportXLS() {
    const data = getExportRows().map((p, i) => ({
      Rank: i + 1,
      Player: p.name,
      Team: p.team,
      Pos: p.pos,
      'Proj Pts': +p.dynamicPoints.toFixed(1),
      'Season PPG': +p.SeasonPPG.toFixed(2),
      'Exp. Games': +p.dynamicExpectedGames.toFixed(1),
    }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'NHL 2026 Projections');
    writeFile(wb, 'nhl2026-projections.xlsx');
  }

  // ── Sort arrow (normal mode only) ──────────────────────────────────────────
  function SortArrow({ col }) {
    const isActive  = sortConfig.key === col.key;
    const isHovered = hoveredHeader === col.key;
    if (!isActive && !isHovered) return <span className="inline-block w-4" />;
    const Icon = isActive
      ? (sortConfig.direction === 'asc' ? ArrowUp : ArrowDown)
      : ((col.defaultDir ?? 'asc') === 'desc' ? ArrowDown : ArrowUp);
    return <Icon size={16} className={isActive ? 'text-primary' : 'text-muted'} />;
  }

  const teamOptions  = [...new Set(ROUND1_MATCHUPS.flatMap((m) => m.teams))].sort();
  const hasSavedList = customOrder !== null;

  // ── Dropdown button style (extends ctrlBtnStyle with space-between layout) ──
  const dropBtnStyle = (hovering) => ctrlBtnStyle(hovering, {
    gap: 8, padding: '0 12px', justifyContent: 'space-between',
  });

  const teamLabel = filterTeams.size === 0
    ? 'Team'
    : filterTeams.size === 1
      ? [...filterTeams][0]
      : `Team (${filterTeams.size})`;
  const posLabel = filterPos === 'all' ? 'Pos' : filterPos;

  return (
    <>
      {/* ── Controls: title left | filters + icons right ─────────────────── */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">

        {/* Left: Draft List title */}
        <h2 style={{
          fontFamily: FF, fontSize: 20, fontWeight: 800,
          color: C.text, letterSpacing: '1px',
          textTransform: 'uppercase', margin: 0, lineHeight: 1,
        }}>
          Draft List
        </h2>

        {/* Right: filters + icon buttons */}
        <div className="flex items-center gap-2.5">

          {/* Team multi-select — hidden on mobile */}
          <div ref={teamDropRef} className="hidden sm:block" style={{ position: 'relative' }}>
            <button
              style={{ ...dropBtnStyle(teamBtnHover), width: 144 }}
              onClick={() => { setTeamOpen((o) => !o); setPosOpen(false); }}
              onMouseEnter={() => setTeamBtnHover(true)}
              onMouseLeave={() => setTeamBtnHover(false)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
                  <ListFilter size={12} color="currentColor" strokeWidth={2.5} />
                </span>
                <span style={{ ...T.label, color: 'inherit' }}>{teamLabel}</span>
              </span>
              <ChevronDown size={12} color="currentColor" />
            </button>
            {teamOpen && (
              <div style={{ ...dropPanel, width: 144, right: 0, left: 'auto' }}>
                {(() => {
                  const allSel = filterTeams.size === 0;
                  return (
                    <div
                      onClick={() => setFilterTeams(new Set())}
                      className={allSel ? 'bg-[#444241]' : 'hover:bg-[#444241]'}
                      style={dropItemBase}
                    >
                      <span style={{ ...T.label, color: allSel ? C.text : C.muted }}>All</span>
                      {allSel && <Check size={14} color={C.text} />}
                    </div>
                  );
                })()}
                {teamOptions.map((t) => {
                  const sel = filterTeams.has(t);
                  return (
                    <div
                      key={t}
                      onClick={() => toggleTeam(t)}
                      className={sel ? 'bg-[#444241]' : 'hover:bg-[#444241]'}
                      style={dropItemBase}
                    >
                      <span style={{ ...T.label, color: sel ? C.text : C.muted }}>{t}</span>
                      {sel && <Check size={14} color={C.text} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pos single-select — hidden on mobile */}
          <div ref={posDropRef} className="hidden sm:block" style={{ position: 'relative' }}>
            <button
              style={{ ...dropBtnStyle(posBtnHover), width: 144 }}
              onClick={() => { setPosOpen((o) => !o); setTeamOpen(false); }}
              onMouseEnter={() => setPosBtnHover(true)}
              onMouseLeave={() => setPosBtnHover(false)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
                  <ListFilter size={12} color="currentColor" strokeWidth={2.5} />
                </span>
                <span style={{ ...T.label, color: 'inherit' }}>{posLabel}</span>
              </span>
              <ChevronDown size={12} color="currentColor" />
            </button>
            {posOpen && (
              <div style={{ ...dropPanel, width: 144, right: 0, left: 'auto' }}>
                {(() => {
                  const allSel = filterPos === 'all';
                  return (
                    <div
                      onClick={() => { setFilterPos('all'); setPosOpen(false); }}
                      className={allSel ? 'bg-[#444241]' : 'hover:bg-[#444241]'}
                      style={dropItemBase}
                    >
                      <span style={{ ...T.label, color: allSel ? C.text : C.muted }}>All</span>
                      {allSel && <Check size={14} color={C.text} />}
                    </div>
                  );
                })()}
                {['F', 'D'].map((p) => {
                  const sel = filterPos === p;
                  return (
                    <div
                      key={p}
                      onClick={() => selectPos(p)}
                      className={sel ? 'bg-[#444241]' : 'hover:bg-[#444241]'}
                      style={dropItemBase}
                    >
                      <span style={{ ...T.label, color: sel ? C.text : C.muted }}>{p}</span>
                      {sel && <Check size={14} color={C.text} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Edit rankings — icon button, active = bright */}
          <button
            onClick={() => editMode ? exitEditMode() : enterEditMode()}
            onMouseEnter={() => setEditBtnHover(true)}
            onMouseLeave={() => setEditBtnHover(false)}
            title={editMode ? 'Exit edit mode' : 'Edit rankings'}
            style={ctrlBtnStyle(editBtnHover || editMode, { width: 36, padding: 0, justifyContent: 'center', flexShrink: 0 })}
          >
            <ArrowUpDown size={14} color="currentColor" />
          </button>

          {/* Download XLS — icon button */}
          <button
            onClick={exportXLS}
            onMouseEnter={() => setXlsBtnHover(true)}
            onMouseLeave={() => setXlsBtnHover(false)}
            title="Save as XLS"
            style={ctrlBtnStyle(xlsBtnHover, { width: 36, padding: 0, justifyContent: 'center', flexShrink: 0 })}
          >
            <Download size={14} color="currentColor" />
          </button>
        </div>
      </div>

      {/* ── Table — scroll container shows 20 rows (20 × 48px = 960px) ───── */}
      <div style={{ overflowY: 'auto', maxHeight: 960 }}>
        <table className="w-full border-collapse text-[15px] sm:text-[16px]" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {editMode && (
                <th className="px-2 h-[40px] sticky top-0 bg-[#232221] w-6" style={{ boxShadow: '0 2px 0 #393836' }} />
              )}
              {COLUMNS.map((col) => {
                const isActive  = !editMode && sortConfig.key === col.key;
                const isHovered = !editMode && hoveredHeader === col.key && col.sortable;
                const isRight   = col.align === 'right';
                const clickable = col.sortable && !editMode;
                return (
                  <th
                    key={col.key}
                    style={{ ...(col.width ? { width: col.width } : {}), boxShadow: '0 2px 0 #393836' }}
                    className={[
                      'px-2 h-[40px] text-[11px] uppercase tracking-[0.065em] sticky top-0 bg-[#232221] font-bold select-none overflow-hidden',
                      isRight ? 'text-right' : 'text-left',
                      clickable ? 'cursor-pointer' : '',
                      (isActive || isHovered) ? 'text-primary' : 'text-muted',
                      col.mobileHide ? 'hidden sm:table-cell' : '',
                      col.key === '#' ? 'sm:pl-3' : '',
                      col.key === 'dynamicExpectedGames' ? 'sm:pr-3' : '',
                    ].join(' ')}
                    onClick={clickable ? () => handleSort(col) : undefined}
                    onMouseEnter={() => clickable && setHoveredHeader(col.key)}
                    onMouseLeave={() => setHoveredHeader(null)}
                  >
                    {isRight ? (
                      <div className="flex items-center justify-end gap-2 min-w-0 overflow-hidden">
                        {col.sortable && !editMode && <SortArrow col={col} />}
                        <span className="truncate">{col.label}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                        <span className="truncate">{col.label}</span>
                        {col.sortable && !editMode && <SortArrow col={col} />}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {editMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayRows.map(rowId)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {displayRows.map((p) => {
                    const globalRank = baseRows.indexOf(p) + 1;
                    return (
                      <SortableRow
                        key={rowId(p)}
                        player={p}
                        globalRank={globalRank}
                        editMode={editMode}
                        injuries={injuries}
                      />
                    );
                  })}
                </tbody>
              </SortableContext>
            </DndContext>
          ) : (
            <tbody>
              {displayRows.map((p, i) => {
                const isSelected = selectedPlayer && p.name === selectedPlayer.name && p.team === selectedPlayer.team;
                return (
                <tr
                  key={i}
                  onClick={() => onPlayerSelect?.(isSelected ? null : p)}
                  className={`transition-colors cursor-pointer ${isSelected ? 'bg-[rgba(255,255,255,0.05)]' : 'hover:bg-[rgba(255,255,255,0.05)]'}`}
                >
                  <td className={`${TD} text-muted truncate sm:pl-3`}>{i + 1}</td>
                  <td className={`${TD} overflow-hidden`}>
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="truncate">{p.name}</span>
                      {getInjury(p.name, injuries) && (
                        <AlertCircle size={16} strokeWidth={1.5} color="#ef4444" style={{ flexShrink: 0 }} />
                      )}
                    </span>
                  </td>
                  <td className={`${TD} text-muted truncate hidden sm:table-cell`}>{p.team}</td>
                  <td className={`${TD} text-muted truncate hidden sm:table-cell`}>{p.pos}</td>
                  <td className={`${TD} text-right truncate hidden sm:table-cell`}>{p.SeasonPPG.toFixed(2)}</td>
                  <td className={`${TD} text-primary text-right truncate`}>{p.dynamicPoints.toFixed(1)}</td>
                  <td className={`${TD} text-right truncate hidden sm:table-cell sm:pr-3`}>{p.dynamicExpectedGames.toFixed(1)}</td>
                </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>
    </>
  );
}
