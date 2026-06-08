import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSnapshotStore } from "./store/snapshotStore";
import {
  Calendar, Search, Download, ChevronDown,
  ExternalLink, ChevronLeft, ChevronRight, BarChart3, X, RotateCcw
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";

// ── Import Supabase services ──
import { fetchFinalSnapshot, type StockMetric } from "./services/dataService";

/* ────────────────────────────────────────────────────────────
   TAG BADGE — compact pill with color coding
   ──────────────────────────────────────────────────────────── */
const tagColors: Record<string, string> = {
  LCAP: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  MCAP: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  SCAP: 'bg-slate-500/15 text-slate-300 border-slate-600/30',
  MICAP: 'bg-slate-600/15 text-slate-400 border-slate-600/20',
  N50: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  N100: 'bg-amber-500/10 text-amber-400/80 border-amber-600/20',
  LEADER: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  GROWTH: 'bg-green-500/15 text-green-300 border-green-600/25',
  EXPORT: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  TECH: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
  PHARMA: 'bg-rose-500/12 text-rose-300 border-rose-500/20',
  BANKX: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  INFRA: 'bg-orange-500/12 text-orange-300 border-orange-500/20',
  DEFX: 'bg-red-500/12 text-red-300 border-red-500/20',
  DUO30: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
};

const TagPill = ({ label }: { label: string }) => {
  const color = tagColors[label] || 'bg-slate-700/20 text-slate-400 border-slate-600/30';
  return (
    <span className={`inline-block px-2 py-[2.5px] rounded text-[12.5px] font-semibold tracking-wide border ${color} whitespace-nowrap`}>
      {label}
    </span>
  );
};

/* ────────────────────────────────────────────────────────────
   FILTER INPUT — reusable styled input component
   ──────────────────────────────────────────────────────────── */
const FilterInput = ({ label, value, onChange, placeholder, type = "text", width = "w-16" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; width?: string;
}) => (
  <div className="flex items-center gap-2.5">
    <span className="text-xs uppercase text-slate-500 font-semibold tracking-wider whitespace-nowrap">{label}</span>
    <input
      type={type}
      className={`bg-slate-800 border border-slate-700/60 rounded-md hover:border-slate-500 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 outline-none px-3 py-2 ${width} text-slate-200 font-mono text-sm text-center placeholder:text-slate-500 transition-all shadow-sm`}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const FilterSelect = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) => (
  <div className="flex items-center gap-2.5">
    <span className="text-xs uppercase text-slate-500 font-semibold tracking-wider whitespace-nowrap">{label}</span>
    <select
      className={`bg-slate-800 border rounded-md outline-none px-3 py-2 text-sm cursor-pointer font-mono transition-all hover:border-slate-500 shadow-sm ${value !== 'All' ? 'border-blue-500/50 text-blue-300 bg-blue-500/5' : 'border-slate-700/60 text-slate-300'
        } focus:border-blue-500/60`}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

/* ────────────────────────────────────────────────────────────
   MAIN TERMINAL COMPONENT
   ──────────────────────────────────────────────────────────── */

const columnHelper = createColumnHelper<StockMetric>();

export default function SwingTerminalDark() {
  // ── State for Supabase data ──
  const [allData, setAllData] = useState<StockMetric[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [minScore, setMinScore] = useState("");
  const [minHealth, setMinHealth] = useState("");
  const [minRsi, setMinRsi] = useState("");
  const [maxRsi, setMaxRsi] = useState("");
  const [minDist, setMinDist] = useState("");
  const [maxDist, setMaxDist] = useState("");
  const [rsiZone, setRsiZone] = useState("All");
  const [marketCap, setMarketCap] = useState("All");
  const [trend, setTrend] = useState("All");
  const [setupFilter, setSetupFilter] = useState("All");
  const [volumeStrength, setVolumeStrength] = useState("All");
  const [momentumStatus, setMomentumStatus] = useState("All");
  const [distanceStatus, setDistanceStatus] = useState("All");
  const [tagsInput, setTagsInput] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: 'swing_score', desc: true }]);

  const [isCalOpen, setIsCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters = searchTerm || minScore || minHealth || minRsi || maxRsi || minDist || maxDist || rsiZone !== "All" || marketCap !== "All" || trend !== "All" || setupFilter !== "All" || volumeStrength !== "All" || momentumStatus !== "All" || distanceStatus !== "All" || tagsInput;

  const resetFilters = useCallback(() => {
    setSearchTerm(""); setMinScore(""); setMinHealth(""); setMinRsi(""); setMaxRsi(""); setMinDist(""); setMaxDist("");
    setRsiZone("All"); setMarketCap("All"); setTrend("All"); setSetupFilter("All"); setVolumeStrength("All"); setMomentumStatus("All"); setDistanceStatus("All"); setTagsInput("");
  }, []);

  // ── Load data from Supabase ──
  useEffect(() => {
    setIsLoading(true);
    fetchFinalSnapshot()
      .then(data => {
        setAllData(data);
        const uniqueDates = [...new Set(data.map(d => d.run_date))].sort().reverse();
        setDates(uniqueDates);
        if (uniqueDates.length > 0 && !selectedDate) {
          setSelectedDate(uniqueDates[0]);
          console.log("Loaded data. Latest date:", uniqueDates[0]);
        }
      })
      .catch(err => console.error("Error loading data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // ── Filter data by selected date ──
  const filteredByDate = useMemo(() => {
    if (!selectedDate) return allData;
    return allData.filter(row => row.run_date === selectedDate);
  }, [allData, selectedDate]);

  // ── Apply all filters ──
  const filteredData = useMemo(() => {
    return filteredByDate.filter(row => {
      if (searchTerm && !row.ticker.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (minScore && (row.swing_score || 0) < Number(minScore)) return false;
      if (minHealth && (row.health_score || 0) < Number(minHealth)) return false;
      if (minRsi && (row.rsi_14 || 0) < Number(minRsi)) return false;
      if (maxRsi && (row.rsi_14 || 0) > Number(maxRsi)) return false;
      if (minDist && (row.distance_pct || 0) < Number(minDist)) return false;
      if (maxDist && (row.distance_pct || 0) > Number(maxDist)) return false;
      if (rsiZone !== "All") {
        const rsi = row.rsi_14 || 0;
        if (rsiZone === "Healthy" && (rsi < 40 || rsi > 60)) return false;
        if (rsiZone === "Oversold" && rsi >= 40) return false;
        if (rsiZone === "Overbought" && rsi <= 60) return false;
      }
      if (trend !== "All" && row.trend_status !== trend) return false;
      if (setupFilter !== "All" && row.setup_type !== setupFilter) return false;
      if (volumeStrength !== "All" && row.volume_strength !== volumeStrength) return false;
      if (momentumStatus !== "All" && row.momentum_status !== momentumStatus) return false;
      if (distanceStatus !== "All" && row.distance_status !== distanceStatus) return false;
      return true;
    });
  }, [filteredByDate, searchTerm, minScore, minHealth, minRsi, maxRsi, minDist, maxDist, rsiZone, trend, setupFilter, volumeStrength, momentumStatus, distanceStatus]);

  // ── Score distribution ──
  const scoreCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    filteredByDate.forEach(row => {
      const score = row.swing_score || 0;
      counts[score] = (counts[score] || 0) + 1;
    });
    return counts;
  }, [filteredByDate]);

  // ── Get unique tags ──
  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>();
    filteredData.forEach(row => {
      if (row.tags) {
        const tagList = row.tags.split(",").map(t => t.trim()).filter(Boolean);
        tagList.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [filteredData]);

  // ── TABLE COLUMNS - CORRECT ORDER ──
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "sno",
        header: "S.No",
        size: 60,
        cell: (info) => <span className="font-mono text-slate-400">{info.row.index + 1}</span>,
      }),
      columnHelper.accessor("ticker", {
        header: "Symbol",
        size: 100,
        cell: info => <span className="font-mono font-bold text-blue-300">{info.getValue()}</span>,
      }),
      columnHelper.accessor("ltp", {
        header: "LTP",
        size: 90,
        cell: info => <span className="font-mono">{(info.getValue() || 0).toFixed(2)}</span>,
      }),
      columnHelper.accessor("health_score", {
        header: "Health",
        size: 80,
        cell: info => <span className="font-mono text-blue-300">{info.getValue() || "N/A"}</span>,
      }),
      columnHelper.accessor("distance_pct", {
        header: "Dist %",
        size: 90,
        cell: info => <span className="font-mono text-slate-300">{(info.getValue() || 0).toFixed(2)}</span>,
      }),
      columnHelper.accessor("swing_score", {
        header: "Swing Score",
        size: 120,
        cell: info => {
          const score = info.getValue() || 0;
          const color = score >= 8 ? "text-green-400" : score >= 5 ? "text-yellow-400" : "text-red-400";
          return <span className={`font-mono font-bold ${color}`}>{score}</span>;
        },
      }),
      columnHelper.accessor("rsi_14", {
        header: "RSI_14",
        size: 90,
        cell: info => {
          const rsi = info.getValue() || 0;
          let color = "text-slate-400";
          if (rsi > 70) color = "text-red-400";
          else if (rsi > 60) color = "text-orange-400";
          else if (rsi < 30) color = "text-green-400";
          else if (rsi < 40) color = "text-lime-400";
          return <span className={`font-mono ${color}`}>{rsi.toFixed(1)}</span>;
        },
      }),
      columnHelper.accessor("momentum_status", {
        header: "Momentum",
        size: 110,
        cell: info => {
          const status = info.getValue() || "NEUTRAL";
          const color = status === "Bullish" ? "text-green-400" : status === "Bearish" ? "text-red-400" : "text-slate-400";
          return <span className={`font-mono font-semibold ${color}`}>{status}</span>;
        },
      }),
      columnHelper.accessor("trend_status", {
        header: "Trend",
        size: 100,
        cell: info => {
          const trend = info.getValue() || "NEUTRAL";
          const color = trend === "Bullish" ? "text-green-400" : trend === "Bearish" ? "text-red-400" : "text-slate-400";
          return <span className={`font-mono font-semibold ${color}`}>{trend}</span>;
        },
      }),
      columnHelper.accessor("weighted_avg", {
        header: "W.Avg",
        size: 100,
        cell: info => <span className="font-mono text-slate-400">{(info.getValue() || 0).toFixed(2)}</span>,
      }),
      columnHelper.accessor("distance_status", {
        header: "Dist Status",
        size: 110,
        cell: info => {
          const status = info.getValue() || "NEUTRAL";
          const color = status && status.includes("Favorable") ? "text-green-400" : status && status.includes("Unfavorable") ? "text-red-400" : "text-slate-400";
          return <span className={`font-mono text-xs ${color}`}>{status}</span>;
        },
      }),
      columnHelper.accessor("current_volume", {
        header: "Vol",
        size: 100,
        cell: info => <span className="font-mono text-slate-400">{((info.getValue() || 0) / 1e6).toFixed(1)}M</span>,
      }),
      columnHelper.accessor("volume_strength", {
        header: "Vol Strength",
        size: 110,
        cell: info => {
          const strength = info.getValue() || "NORMAL";
          const color = strength === "HIGH" ? "text-green-400" : strength === "VERY_HIGH" ? "text-green-500" : "text-slate-400";
          return <span className={`font-mono text-xs font-semibold ${color}`}>{strength}</span>;
        },
      }),
      columnHelper.accessor("setup_type", {
        header: "Setup",
        size: 140,
        cell: info => <TagPill label={info.getValue() || "NEUTRAL"} />,
      }),
      columnHelper.accessor("tags", {
        header: "Tags",
        size: 150,
        cell: info => {
          const tagsStr = info.getValue() || "";
          const tagList = tagsStr.split(",").filter(Boolean).map(t => t.trim());
          return (
            <div className="flex gap-1 flex-wrap">
              {tagList.map((tag: string) => <TagPill key={tag} label={tag} />)}
            </div>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleExport = useCallback(() => {
    const csv = [
      ["S.No", "Symbol", "LTP", "Health", "Dist%", "Swing Score", "RSI14", "Momentum", "Trend", "W.Avg", "Dist Status", "Volume", "Vol Strength", "Setup", "Tags"].join(","),
      ...filteredData.map((row, idx) =>
        [idx + 1, row.ticker, row.ltp, row.health_score, row.distance_pct, row.swing_score, row.rsi_14, row.momentum_status, row.trend_status, row.weighted_avg, row.distance_status, row.current_volume, row.volume_strength, row.setup_type, (row.tags || "").replace(/,/g, ";")].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `swing_signals_${selectedDate}.csv`);
    link.click();
  }, [filteredData, selectedDate]);

  const calendarData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0).getDate();
    const nextDays = 7 - lastDay.getDay() - 1;

    const prev = Array.from({ length: firstDay.getDay() }, (_, i) => ({
      date: prevLastDay - firstDay.getDay() + i + 1,
      isCurrentMonth: false,
    }));

    const current = Array.from({ length: lastDay.getDate() }, (_, i) => ({
      date: i + 1,
      isCurrentMonth: true,
    }));

    const next = Array.from({ length: nextDays }, (_, i) => ({
      date: i + 1,
      isCurrentMonth: false,
    }));

    return [...prev, ...current, ...next];
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 font-mono">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col border border-slate-800">
      {/* ─── HEADER ─── */}
      <header className="bg-slate-900 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <BarChart3 size={20} className="text-blue-400" />
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-100">Swing Terminal</h1>
          <span className="text-xs text-slate-600 font-mono">v2.4</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsCalOpen(!isCalOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700/60 hover:border-slate-500/50 rounded-md text-[11px] font-mono uppercase transition-all text-slate-400 hover:text-slate-200"
            >
              <Calendar size={13} className="text-slate-500" />
              {selectedDate || "Select Date"}
            </button>

            {isCalOpen && (
              <div ref={calRef} className="absolute right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg p-4 z-50 shadow-lg w-80">
                <div className="border-t border-slate-700 pt-3">
                  <div className="text-[10px] font-mono text-slate-500 mb-2 uppercase">Available Dates ({dates.length}):</div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {dates.length > 0 ? (
                      dates.map(date => (
                        <button
                          key={date}
                          onClick={() => { setSelectedDate(date); setIsCalOpen(false); }}
                          className={`block w-full text-left px-3 py-2 text-[11px] font-mono rounded transition-all ${selectedDate === date ? 'bg-blue-600/40 text-blue-300 border border-blue-500/50' : 'hover:bg-slate-700/40 text-slate-300 border border-slate-700/30'}`}
                        >
                          {date}
                        </button>
                      ))
                    ) : (
                      <div className="text-slate-500 text-[10px] px-3 py-2">No dates available</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700/60 hover:border-slate-500/50 rounded-md text-[11px] font-mono uppercase transition-all text-slate-400 hover:text-slate-200">
            <Download size={13} className="text-slate-500" /> Export
          </button>
        </div>
      </header>

      {/* ─── FILTER BAR ─── */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-2.5 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-5 min-w-max">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/60 rounded-md px-3 py-1.5 focus-within:border-blue-500/50 transition-all w-44">
            <Search size={13} className="text-slate-500 shrink-0" />
            <input
              placeholder="Search symbol..."
              className="bg-transparent border-none outline-none text-slate-200 font-mono text-[11px] placeholder:text-slate-600 uppercase w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-slate-300"><X size={12} /></button>}
          </div>

          <div className="h-5 w-px bg-[#1c2030]" />

          <FilterInput label="Score" value={minScore} onChange={setMinScore} placeholder="5" type="number" width="w-14" />

          <div className="h-5 w-px bg-[#1c2030]" />

          <FilterInput label="Health" value={minHealth} onChange={setMinHealth} placeholder="50" type="number" width="w-14" />

          <div className="h-5 w-px bg-[#1c2030]" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider whitespace-nowrap">RSI</span>
            <input type="number" className="bg-slate-800 border border-slate-700/60 rounded-md outline-none px-2.5 py-1.5 w-12 text-slate-200 font-mono text-[11px] text-center placeholder:text-slate-600" placeholder="Min" value={minRsi} onChange={e => setMinRsi(e.target.value)} />
            <span className="text-slate-600 text-[10px]">to</span>
            <input type="number" className="bg-slate-800 border border-slate-700/60 rounded-md outline-none px-2.5 py-1.5 w-12 text-slate-200 font-mono text-[11px] text-center placeholder:text-slate-600" placeholder="Max" value={maxRsi} onChange={e => setMaxRsi(e.target.value)} />
          </div>

          <div className="h-5 w-px bg-[#1c2030]" />

          <FilterSelect label="Trend" value={trend} onChange={setTrend} options={[
            { value: "All", label: "ALL" }, { value: "Bullish", label: "▲ BULLISH" }, { value: "Bearish", label: "▼ BEARISH" }
          ]} />

          <div className="h-5 w-px bg-[#1c2030]" />

          <FilterSelect label="Setup" value={setupFilter} onChange={setSetupFilter} options={[
            { value: "All", label: "ALL SETUPS" },
            { value: "HIGH_CONVICTION", label: "HIGH CONVICTION" },
            { value: "WATCHLIST", label: "WATCHLIST" },
            { value: "MOMENTUM_SETUP", label: "MOMENTUM SETUP" },
            { value: "WEAK_SETUP", label: "WEAK SETUP" }
          ]} />

          {hasActiveFilters && (
            <>
              <div className="h-5 w-px bg-[#1c2030]" />
              <button onClick={resetFilters} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-500 hover:text-red-400 tracking-wider transition-colors">
                <RotateCcw size={11} /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── TABLE ─── */}
      <div className="flex-1 overflow-auto bg-slate-950 relative">
        <table className="w-full text-left border-collapse min-w-[2000px]">
          <thead className="bg-slate-900 sticky top-0 z-20">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b-2 border-slate-800">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 hover:bg-slate-800/50 transition-colors select-none group"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className={`transition-opacity ${header.column.getIsSorted() ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                          {{ asc: <ChevronDown className="w-3.5 h-3.5 text-green-400 rotate-180" />, desc: <ChevronDown className="w-3.5 h-3.5 text-red-400" /> }[header.column.getIsSorted() as string] ?? <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr key={row.id} className={`border-b border-slate-800/60 hover:bg-slate-800 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/40'}`}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-5 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {table.getRowModel().rows.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-600">
            <Search size={36} className="opacity-15" />
            <div className="text-xs font-mono uppercase tracking-[0.15em]">No Signals Match Current Filters</div>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-[11px] text-blue-400 hover:text-blue-300 font-mono uppercase tracking-wider transition-colors">Reset All Filters</button>
            )}
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <div className="h-7 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-5 text-[10px] font-mono text-slate-600 uppercase tracking-[0.12em] shrink-0">
        <span>SwingLogic Quantitative Terminal v2.4</span>
        <div className="flex items-center gap-4">
          <span>{filteredData.length} <span className="text-slate-500">signals</span></span>
          <span>{allUniqueTags.length} <span className="text-slate-500">tags indexed</span></span>
        </div>
      </div>
    </div>
  );
}
