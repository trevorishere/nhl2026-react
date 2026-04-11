import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { BASE_DATA } from '../data/players';
import { CHALK_PICKS, ROUND1_MATCHUPS, ROUND_PROGRESSION } from '../data/constants';
import { getPosition } from '../data/positions';
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

// ─── Button style constants ────────────────────────────────────────────────────
const btnBase    = 'border border-border bg-surface px-3.5 py-2 rounded-full cursor-pointer text-app-text text-sm font-medium hover:opacity-80 transition-opacity';
const btnPrimary = 'border border-primary bg-primary px-3.5 py-2 rounded-full cursor-pointer text-white text-sm font-medium hover:opacity-90 transition-opacity';

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
  { key: '#',                    label: '#',          sortable: false, align: 'left'  },
  { key: 'name',                 label: 'Player',     sortable: true,  align: 'left'  },
  { key: 'team',                 label: 'Team',       sortable: true,  align: 'left'  },
  { key: 'pos',                  label: 'Pos',        sortable: true,  align: 'left'  },
  { key: 'dynamicPoints',        label: 'Proj Pts',   sortable: true,  align: 'right', defaultDir: 'desc' },
  { key: 'SeasonPPG',            label: 'Season PPG', sortable: false, align: 'right' },
  { key: 'dynamicExpectedGames', label: 'Exp. Games', sortable: false, align: 'right' },
];

// ─── Unique stable ID per player ───────────────────────────────────────────────
const rowId = (p) => p.name + '|' + p.team;

// ─── Sortable row sub-component ───────────────────────────────────────────────
function SortableRow({ player, globalRank, editMode }) {
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
      <td className="px-2 py-2.5 border-b border-border text-muted">{globalRank}</td>
      <td className="px-2 py-2.5 border-b border-border font-medium">{player.name}</td>
      <td className="px-2 py-2.5 border-b border-border text-muted">{player.team}</td>
      <td className="px-2 py-2.5 border-b border-border text-muted">{player.pos}</td>
      <td className="px-2 py-2.5 border-b border-border font-bold text-primary text-right">
        {player.dynamicPoints.toFixed(1)}
      </td>
      <td className="px-2 py-2.5 border-b border-border text-right">{player.SeasonPPG.toFixed(2)}</td>
      <td className="px-2 py-2.5 border-b border-border text-muted text-right">
        {player.dynamicExpectedGames.toFixed(1)}
      </td>
    </tr>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function PlayerTable({ picks, mode, seriesLengths, onPlayerSelect, selectedPlayer }) {
  const [sortConfig, setSortConfig]       = useState({ key: 'dynamicPoints', direction: 'desc' });
  const [hoveredHeader, setHoveredHeader] = useState(null);

  // Edit mode state
  const [editMode, setEditMode]   = useState(false);
  const [filterPos, setFilterPos] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');

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
    if (filterPos  !== 'all' && p.pos  !== filterPos)  return false;
    if (filterTeam !== 'all' && p.team !== filterTeam) return false;
    return true;
  }), [baseRows, filterPos, filterTeam]);

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

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(13);
    doc.text('NHL 2026 Playoff Point Projections', 14, 15);
    doc.autoTable({
      head: [['#', 'Player', 'Team', 'Pos', 'Proj Pts', 'PPG', 'Exp. Games']],
      body: getExportRows().map((p, i) => [
        i + 1, p.name, p.team, p.pos,
        p.dynamicPoints.toFixed(1),
        p.SeasonPPG.toFixed(2),
        p.dynamicExpectedGames.toFixed(1),
      ]),
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [1, 105, 111] },
    });
    doc.save('nhl2026-projections.pdf');
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

  return (
    <>
      {/* ── Controls row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {!editMode ? (
          <div className="flex items-center gap-2">
            <button onClick={enterEditMode} className={btnBase}>Edit Rankings</button>
            {hasSavedList && (
              <span className="text-[12px] text-muted flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                Custom list saved
              </span>
            )}
          </div>
        ) : (
          <>
            <button onClick={exitEditMode} className={btnPrimary}>Done Editing</button>
            <button onClick={resetOrder}   className={btnBase}>Reset to auto-rank</button>
            <button onClick={exportXLS}    className={btnBase}>Export XLS</button>
            <button onClick={exportPDF}    className={btnBase}>Export PDF</button>
          </>
        )}
      </div>

      {/* ── Filter bar (edit mode only) ──────────────────────────────────── */}
      {editMode && (
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div className="flex gap-1">
            {['all', 'F', 'D'].map((pos) => (
              <button
                key={pos}
                onClick={() => setFilterPos(pos)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                  filterPos === pos
                    ? 'bg-primary border-primary text-white'
                    : 'bg-surface border-border text-app-text hover:opacity-80'
                }`}
              >
                {pos === 'all' ? 'All' : pos}
              </button>
            ))}
          </div>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="bg-surface border border-border rounded-lg text-sm px-2 py-1 text-app-text cursor-pointer"
          >
            <option value="all">All teams</option>
            {teamOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="text-[12px] text-muted">
            {displayRows.length} of {baseRows.length} players
          </span>
        </div>
      )}

      <div className="h-1" />

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="max-h-[50vh] overflow-auto border border-border rounded-xl max-w-4xl mx-auto">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr>
              {editMode && (
                <th className="px-2 py-2.5 border-b border-border sticky top-0 bg-surface w-6" />
              )}
              {COLUMNS.map((col) => {
                const isActive  = !editMode && sortConfig.key === col.key;
                const isHovered = !editMode && hoveredHeader === col.key && col.sortable;
                const isRight   = col.align === 'right';
                const clickable = col.sortable && !editMode;
                return (
                  <th
                    key={col.key}
                    className={[
                      'px-2 py-2.5 border-b border-border text-[12px] uppercase tracking-[0.06em] sticky top-0 bg-surface font-semibold select-none',
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
                  <td className="px-2 py-2.5 border-b border-border text-muted">{i + 1}</td>
                  <td className="px-2 py-2.5 border-b border-border font-medium">{p.name}</td>
                  <td className="px-2 py-2.5 border-b border-border text-muted">{p.team}</td>
                  <td className="px-2 py-2.5 border-b border-border text-muted">{p.pos}</td>
                  <td className="px-2 py-2.5 border-b border-border font-bold text-primary text-right">
                    {p.dynamicPoints.toFixed(1)}
                  </td>
                  <td className="px-2 py-2.5 border-b border-border text-right">{p.SeasonPPG.toFixed(2)}</td>
                  <td className="px-2 py-2.5 border-b border-border text-muted text-right">{p.dynamicExpectedGames.toFixed(1)}</td>
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
