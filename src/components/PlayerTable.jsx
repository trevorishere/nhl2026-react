import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, GripVertical, AlertCircle, ChevronDown, ListFilter, Check } from 'lucide-react';
import { BASE_DATA } from '../data/players';
import { CHALK_PICKS, ROUND1_MATCHUPS, ROUND_PROGRESSION } from '../data/constants';
import { getPosition } from '../data/positions';
import Toggle from './Toggle';
import { C, T, ctrlBtnStyle, dropItemBase, dropPanel } from '../styles/tokens';
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
const btnBase = 'border border-border bg-surface px-3.5 py-2 rounded-full cursor-pointer text-app-text text-sm font-medium hover:opacity-80 transition-opacity';
const TD      = 'px-2 h-[48px] border-b border-border'; // base table cell

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
const COLUMNS = [
  { key: '#',                    label: '#',          sortable: false, align: 'left',  width: '4%'  },
  { key: 'name',                 label: 'Player',     sortable: true,  align: 'left',  width: '31%' },
  { key: 'team',                 label: 'Team',       sortable: true,  align: 'left',  width: '9%'  },
  { key: 'pos',                  label: 'Pos',        sortable: true,  align: 'left',  width: '7%'  },
  { key: 'SeasonPPG',            label: 'Season PPG', sortable: false, align: 'right', width: '18%' },
  { key: 'dynamicPoints',        label: 'Proj Pts',   sortable: true,  align: 'right', defaultDir: 'desc', width: '13%' },
  { key: 'dynamicExpectedGames', label: 'Proj Games', sortable: false, align: 'right', width: '18%' },
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
    <tr ref={setNodeRef} style={style} className="hover:bg-surface2 transition-colors">
      {editMode && (
        <td
          className="px-2 py-2.5 border-b border-border text-muted cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </td>
      )}
      <td className={`${TD} text-muted font-bold`}>{globalRank}</td>
      <td className={`${TD} font-medium`}>
        <span className="flex items-center gap-3">
          {player.name}
          {getInjury(player.name, injuries) && (
            <AlertCircle size={16} strokeWidth={1.5} color="#ef4444" style={{ flexShrink: 0 }} />
          )}
        </span>
      </td>
      <td className={`${TD} text-muted`}>{player.team}</td>
      <td className={`${TD} text-muted`}>{player.pos}</td>
      <td className={`${TD} text-right`}>{player.SeasonPPG.toFixed(2)}</td>
      <td className={`${TD} font-bold text-primary text-right`}>{player.dynamicPoints.toFixed(1)}</td>
      <td className={`${TD} font-bold text-right`}>{player.dynamicExpectedGames.toFixed(1)}</td>
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
    gap: 8, padding: '0 12px', justifyContent: 'space-between', color: C.muted,
  });

  const teamLabel = filterTeams.size === 0
    ? 'Team'
    : filterTeams.size === 1
      ? [...filterTeams][0]
      : `Team (${filterTeams.size})`;
  const posLabel = filterPos === 'all' ? 'Pos' : filterPos;

  return (
    <>
      {/* ── Controls: filters left | edit/export right ───────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">

        {/* Left: always-visible filters */}
        <div className="flex items-center gap-2.5">

          {/* Team multi-select */}
          <div ref={teamDropRef} style={{ position: 'relative' }}>
            <button
              style={{ ...dropBtnStyle(teamBtnHover), width: 144 }}
              onClick={() => { setTeamOpen((o) => !o); setPosOpen(false); }}
              onMouseEnter={() => setTeamBtnHover(true)}
              onMouseLeave={() => setTeamBtnHover(false)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
                  <ListFilter size={12} color={C.muted} strokeWidth={2.5} />
                </span>
                <span style={T.label}>{teamLabel}</span>
              </span>
              <ChevronDown size={12} color={C.muted} />
            </button>
            {teamOpen && (
              <div style={{ ...dropPanel, width: 144 }}>
                {/* ALL option */}
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

          {/* Pos single-select */}
          <div ref={posDropRef} style={{ position: 'relative' }}>
            <button
              style={{ ...dropBtnStyle(posBtnHover), width: 124 }}
              onClick={() => { setPosOpen((o) => !o); setTeamOpen(false); }}
              onMouseEnter={() => setPosBtnHover(true)}
              onMouseLeave={() => setPosBtnHover(false)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
                  <ListFilter size={12} color={C.muted} strokeWidth={2.5} />
                </span>
                <span style={T.label}>{posLabel}</span>
              </span>
              <ChevronDown size={12} color={C.muted} />
            </button>
            {posOpen && (
              <div style={{ ...dropPanel, width: 124 }}>
                {/* ALL option */}
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

        </div>

        {/* Right: edit toggle + export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {/* Edit Rankings toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', height: 40 }}>
            <span style={T.label}>Edit Rankings</span>
            <Toggle on={editMode} onChange={() => editMode ? exitEditMode() : enterEditMode()} />
          </div>

          {/* Reset to auto-rank — only shown in edit mode */}
          {editMode && (
            <button onClick={resetOrder} className={btnBase} style={{ marginLeft: 4, marginRight: 4 }}>
              Reset order
            </button>
          )}

          {/* Vertical divider */}
          <div style={{ width: 1, height: 24, background: C.border, margin: '0 4px', flexShrink: 0 }} />

          {/* Save as XLS — ghost button (transparent default) */}
          <button
            onClick={exportXLS}
            onMouseEnter={() => setXlsBtnHover(true)}
            onMouseLeave={() => setXlsBtnHover(false)}
            style={{
              ...ctrlBtnStyle(xlsBtnHover, { padding: '0 16px', color: C.muted }),
              background: xlsBtnHover ? C.btnHover : 'transparent',
            }}
          >
            Save as XLS
          </button>
        </div>
      </div>

      {/* ── Table — scroll container shows 20 rows (20 × 48px = 960px) ───── */}
      <div style={{ overflowY: 'auto', maxHeight: 960 }}>
        <table className="w-full border-collapse text-[16px]" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {editMode && (
                <th className="px-2 h-[40px] border-b-2 border-border sticky top-0 bg-[#232221] w-6" />
              )}
              {COLUMNS.map((col) => {
                const isActive  = !editMode && sortConfig.key === col.key;
                const isHovered = !editMode && hoveredHeader === col.key && col.sortable;
                const isRight   = col.align === 'right';
                const clickable = col.sortable && !editMode;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={[
                      'px-2 h-[40px] border-b-2 border-border text-[13px] uppercase tracking-[0.065em] sticky top-0 bg-[#232221] font-bold select-none',
                      isRight ? 'text-right' : 'text-left',
                      clickable ? 'cursor-pointer' : '',
                      (isActive || isHovered) ? 'text-primary' : 'text-muted',
                    ].join(' ')}
                    onClick={clickable ? () => handleSort(col) : undefined}
                    onMouseEnter={() => clickable && setHoveredHeader(col.key)}
                    onMouseLeave={() => setHoveredHeader(null)}
                  >
                    {isRight ? (
                      <div className="flex items-center justify-end gap-2">
                        {col.sortable && !editMode && <SortArrow col={col} />}
                        <span>{col.label}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{col.label}</span>
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
                  className={`transition-colors cursor-pointer ${isSelected ? 'bg-surface2' : 'hover:bg-surface2'}`}
                >
                  <td className={`${TD} text-muted font-bold`}>{i + 1}</td>
                  <td className={`${TD} font-medium`}>
                    <span className="flex items-center gap-3">
                      {p.name}
                      {getInjury(p.name, injuries) && (
                        <AlertCircle size={16} strokeWidth={1.5} color="#ef4444" style={{ flexShrink: 0 }} />
                      )}
                    </span>
                  </td>
                  <td className={`${TD} text-muted`}>{p.team}</td>
                  <td className={`${TD} text-muted`}>{p.pos}</td>
                  <td className={`${TD} text-right`}>{p.SeasonPPG.toFixed(2)}</td>
                  <td className={`${TD} font-bold text-primary text-right`}>{p.dynamicPoints.toFixed(1)}</td>
                  <td className={`${TD} font-bold text-right`}>{p.dynamicExpectedGames.toFixed(1)}</td>
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
