import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Calendar, Search, Download, ChevronDown,
  ExternalLink, X, RotateCcw, Zap, TrendingUp, TrendingDown, Minus
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";

import { fetchFinalSnapshot, type StockMetric } from "./services/dataService";

/* ────────────────────────────────────────────────────────────
   TICKER AVATAR
   ──────────────────────────────────────────────────────────── */
const avatarColors = [
  'bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600',
  'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-teal-600',
  'bg-orange-600', 'bg-pink-600', 'bg-lime-700', 'bg-sky-600',
];

const getAvatarColor = (ticker: string) => {
  const idx = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
  return avatarColors[idx];
};

const TickerAvatar = ({ ticker }: { ticker: string }) => {
  const initials = ticker.slice(0, 2).toUpperCase();
  const color = getAvatarColor(ticker);
  return (
    <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0 font-bold text-white text-xs tracking-wide shadow-lg`}>
      {initials}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   TAG PILL — each tag has its own distinct color
   ──────────────────────────────────────────────────────────── */
const tagColors: Record<string, string> = {
  LCAP:            'bg-blue-500/20 text-blue-300 border-blue-500/30',
  MCAP:            'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  SCAP:            'bg-slate-500/20 text-slate-300 border-slate-600/30',
  MICAP:           'bg-slate-600/20 text-slate-400 border-slate-600/25',
  N50:             'bg-amber-500/20 text-amber-300 border-amber-500/30',
  N100:            'bg-amber-500/15 text-amber-400 border-amber-600/25',
  LEADER:          'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  GROWTH:          'bg-green-500/20 text-green-300 border-green-600/30',
  EXPORT:          'bg-violet-500/20 text-violet-300 border-violet-500/30',
  TECH:            'bg-sky-500/20 text-sky-300 border-sky-500/30',
  PHARMA:          'bg-rose-500/20 text-rose-300 border-rose-500/25',
  BANKX:           'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  INFRA:           'bg-orange-500/20 text-orange-300 border-orange-500/25',
  DEFX:            'bg-red-500/20 text-red-300 border-red-500/25',
  DUO30:           'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  AUTO:            'bg-blue-400/15 text-blue-300 border-blue-400/25',
  PSU:             'bg-purple-500/20 text-purple-300 border-purple-500/30',
  FMCG:            'bg-green-600/20 text-green-300 border-green-600/30',
  NBFC:            'bg-teal-500/20 text-teal-300 border-teal-500/30',
  NICHE:           'bg-pink-500/20 text-pink-300 border-pink-500/30',
  REAL:            'bg-stone-500/20 text-stone-300 border-stone-500/30',
  PREM:            'bg-yellow-600/20 text-yellow-200 border-yellow-600/30',
  GOVCAP:          'bg-slate-600/20 text-slate-300 border-slate-500/30',
  CHEMX:           'bg-lime-600/20 text-lime-300 border-lime-500/30',
  BRANDX:          'bg-rose-400/20 text-rose-300 border-rose-400/30',
  STRAT:           'bg-indigo-400/20 text-indigo-300 border-indigo-400/30',
  RURALX:          'bg-green-700/20 text-green-400 border-green-600/30',
  DOMEST:          'bg-slate-500/15 text-slate-300 border-slate-600/30',
  CONSUM:          'bg-cyan-600/20 text-cyan-300 border-cyan-500/30',
  SCALEUP:         'bg-violet-400/20 text-violet-300 border-violet-400/30',
  URBNX:           'bg-blue-700/20 text-blue-300 border-blue-600/30',
  INDST:           'bg-orange-600/20 text-orange-300 border-orange-600/30',
  METAL:           'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  ENERGY:          'bg-yellow-700/20 text-yellow-300 border-yellow-600/30',
  CYCL:            'bg-teal-600/20 text-teal-300 border-teal-500/30',
  RETAIL:          'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  COMMOD:          'bg-orange-700/20 text-orange-300 border-orange-600/30',
  COMPD:           'bg-sky-700/20 text-sky-300 border-sky-600/30',
  HROE:            'bg-emerald-700/20 text-emerald-300 border-emerald-600/30',
  ASSETL:          'bg-violet-700/20 text-violet-300 border-violet-600/30',
  GLOBEX:          'bg-blue-800/20 text-blue-300 border-blue-700/30',
  HIGH_CONVICTION: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  WATCHLIST:       'bg-amber-500/20 text-amber-300 border-amber-500/30',
  MOMENTUM_SETUP:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  WEAK_SETUP:      'bg-slate-600/20 text-slate-400 border-slate-600/30',
};

const TagPill = ({ label }: { label: string }) => {
  const color = tagColors[label] || 'bg-violet-700/20 text-violet-300 border-violet-600/30';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold tracking-wide border ${color} whitespace-nowrap leading-none`}>
      {label}
    </span>
  );
};

/* ────────────────────────────────────────────────────────────
   SETUP BADGE
   ──────────────────────────────────────────────────────────── */
const SetupBadge = ({ value }: { value: string }) => {
  const setupMap: Record<string, string> = {
    HIGH_CONVICTION: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    WATCHLIST:       'bg-amber-500/15 text-amber-300 border-amber-500/30',
    MOMENTUM_SETUP:  'bg-blue-500/15 text-blue-300 border-blue-500/30',
    WEAK_SETUP:      'bg-slate-600/15 text-slate-400 border-slate-600/30',
  };
  const displayMap: Record<string, string> = {
    HIGH_CONVICTION: 'HIGH CONVICTION',
    WATCHLIST:       'WATCHLIST',
    MOMENTUM_SETUP:  'MOMENTUM',
    WEAK_SETUP:      'WEAK',
  };
  const color = setupMap[value] || 'bg-slate-700/20 text-slate-400 border-slate-600/30';
  const label = displayMap[value] || value;
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10.5px] font-bold tracking-wider border ${color} whitespace-nowrap`}>
      {label}
    </span>
  );
};

/* ────────────────────────────────────────────────────────────
   SWING SCORE BADGE
   ──────────────────────────────────────────────────────────── */
const SwingScoreBadge = ({ score }: { score: number }) => {
  const color = score >= 8
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
    : score >= 5
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'
      : 'bg-red-500/15 text-red-400 border-red-500/30';
  return (
    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border-2 ${color} font-black text-base shadow-lg`}>
      {score}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   HEALTH BADGE — color-coded by value range
   ──────────────────────────────────────────────────────────── */
const HealthBadge = ({ score }: { score: number | null }) => {
  if (score === null || score === undefined)
    return <span className="text-slate-600 text-xs font-mono">—</span>;

  const { text, bg, border } =
    score >= 80 ? { text: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' } :
    score >= 60 ? { text: 'text-amber-300',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30'   } :
    score >= 40 ? { text: 'text-orange-300',  bg: 'bg-orange-500/15',  border: 'border-orange-500/30'  } :
                  { text: 'text-red-400',      bg: 'bg-red-500/15',     border: 'border-red-500/25'     };

  return (
    <span className={`inline-flex items-center justify-center w-10 h-7 rounded-md border font-bold font-mono text-sm ${text} ${bg} ${border}`}>
      {score}
    </span>
  );
};

/* ────────────────────────────────────────────────────────────
   DIST PCT CELL
   ──────────────────────────────────────────────────────────── */
const DistCell = ({ pct, status }: { pct: number; status: string }) => {
  const isNeg = pct < 0;
  const isPos = pct > 0;
  const pctColor = isNeg ? 'text-red-400' : isPos ? 'text-emerald-400' : 'text-slate-400';
  const statusColor = status && status.toLowerCase().includes('ideal')
    ? 'text-emerald-400/70' : status && status.toLowerCase().includes('favorable')
      ? 'text-green-400/70' : status && status.toLowerCase().includes('deep')
        ? 'text-orange-400/70' : 'text-slate-500';
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`font-mono font-semibold text-sm ${pctColor}`}>
        {isNeg ? '' : pct > 0 ? '+' : ''}{pct.toFixed(2)}%
      </span>
      {status && <span className={`text-[9.5px] uppercase tracking-wide font-medium ${statusColor}`}>{status}</span>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   RSI CELL
   ──────────────────────────────────────────────────────────── */
const RsiCell = ({ rsi }: { rsi: number }) => {
  let color = "text-slate-300";
  let label = "";
  if (rsi > 70)      { color = "text-red-400";   label = "OB"; }
  else if (rsi > 60) { color = "text-orange-400"; }
  else if (rsi < 30) { color = "text-green-400";  label = "OS"; }
  else if (rsi < 40) { color = "text-lime-400";   }
  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-mono font-semibold text-sm ${color}`}>{rsi.toFixed(1)}</span>
      {label && (
        <span className={`text-[9px] font-bold px-1 rounded ${rsi > 70 ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
          {label}
        </span>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   TREND CELL
   ──────────────────────────────────────────────────────────── */
const TrendCell = ({ value }: { value: string }) => {
  const normalized = (value || '').toLowerCase();
  const isBull    = normalized.includes('bullish');
  const isBear    = normalized.includes('bearish');
  const isStrong  = normalized.includes('strong');

  if (isBull) return (
    <div
      style={{
        background: isStrong ? 'rgba(16,185,129,0.20)' : 'rgba(16,185,129,0.12)',
        border: `1px solid rgba(16,185,129,${isStrong ? '0.45' : '0.30'})`,
      }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
    >
      <TrendingUp size={11} className="text-emerald-400 shrink-0" />
      <span className="font-bold text-[10.5px] uppercase tracking-wider text-emerald-300">
        {isStrong ? 'Strong Bullish' : 'Bullish'}
      </span>
    </div>
  );

  if (isBear) return (
    <div
      style={{
        background: isStrong ? 'rgba(239,68,68,0.20)' : 'rgba(239,68,68,0.12)',
        border: `1px solid rgba(239,68,68,${isStrong ? '0.45' : '0.30'})`,
      }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
    >
      <TrendingDown size={11} className="text-red-400 shrink-0" />
      <span className="font-bold text-[10.5px] uppercase tracking-wider text-red-400">
        {isStrong ? 'Strong Bearish' : 'Bearish'}
      </span>
    </div>
  );

  return (
    <div
      style={{ background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.20)' }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
    >
      <Minus size={11} className="text-slate-500 shrink-0" />
      <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-500">{value || 'Neutral'}</span>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   VOLUME CELL
   ──────────────────────────────────────────────────────────── */
const VolumeCell = ({ strength }: { strength: string }) => {
  const map: Record<string, { style: React.CSSProperties; dotColor: string; textClass: string; label: string }> = {
    VERY_HIGH: {
      style: { background: 'rgba(16,185,129,0.13)', border: '1px solid rgba(16,185,129,0.32)' },
      dotColor: '#34d399', textClass: 'text-emerald-300', label: 'VERY HIGH',
    },
    HIGH: {
      style: { background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.28)' },
      dotColor: '#4ade80', textClass: 'text-green-400', label: 'HIGH',
    },
    NORMAL: {
      style: { background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.28)' },
      dotColor: '#38bdf8', textClass: 'text-sky-400', label: 'NORMAL',
    },
    LOW: {
      style: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' },
      dotColor: '#f87171', textClass: 'text-red-400', label: 'LOW',
    },
  };
  const s = map[strength] || map.NORMAL;
  return (
    <div style={s.style} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md">
      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.dotColor, flexShrink: 0 }} />
      <span className={`font-mono font-semibold text-[10.5px] uppercase tracking-wide ${s.textClass}`}>{s.label}</span>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   TAGS CELL — renders each tag as a colored pill
   ──────────────────────────────────────────────────────────── */
const TagsCell = ({ tagsStr }: { tagsStr: string }) => {
  const tagList = (tagsStr || "").split(",").map(t => t.trim()).filter(Boolean);
  const visible = tagList.slice(0, 4);
  const more = tagList.length - 4;
  return (
    <div className="flex gap-1 flex-wrap items-center">
      {visible.map((tag) => <TagPill key={tag} label={tag} />)}
      {more > 0 && (
        <span className="text-[9.5px] text-slate-500 font-mono bg-slate-800/60 border border-slate-700/40 px-1.5 py-0.5 rounded-md">
          +{more}
        </span>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   FILTER COMPONENTS
   ──────────────────────────────────────────────────────────── */
const FilterInput = ({ label, value, onChange, placeholder, type = "text", width = "w-16" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; width?: string;
}) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-widest whitespace-nowrap">{label}</span>
    <input
      type={type}
      className={`bg-[#0d1117] border border-slate-700/50 rounded-md hover:border-slate-500/70 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/15 outline-none px-2.5 py-1.5 ${width} text-slate-200 font-mono text-xs text-center placeholder:text-slate-600 transition-all`}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const FilterSelect = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-widest whitespace-nowrap">{label}</span>
    <select
      className={`bg-[#0d1117] border rounded-md outline-none px-2.5 py-1.5 text-xs cursor-pointer font-mono transition-all hover:border-slate-500/70 ${
        value !== 'All' ? 'border-blue-500/40 text-blue-300 bg-blue-500/5' : 'border-slate-700/50 text-slate-300'
      } focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/15`}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

/* ────────────────────────────────────────────────────────────
   STAT CHIP
   ──────────────────────────────────────────────────────────── */
const StatChip = ({ label, value, accent }: { label: string; value: string | number; accent?: string }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06]">
    {accent && <div className={`w-1.5 h-1.5 rounded-full ${accent}`} />}
    <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{label}</span>
    <span className="font-mono font-bold text-slate-200 text-sm">{value}</span>
  </div>
);

/* ────────────────────────────────────────────────────────────
   MAIN TERMINAL COMPONENT
   ──────────────────────────────────────────────────────────── */
const columnHelper = createColumnHelper<StockMetric>();

export default function SwingTerminalDark() {
  const [allData, setAllData] = useState<StockMetric[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

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

  const hasActiveFilters = searchTerm || minScore || minHealth || minRsi || maxRsi || minDist || maxDist
    || rsiZone !== "All" || marketCap !== "All" || trend !== "All" || setupFilter !== "All"
    || volumeStrength !== "All" || momentumStatus !== "All" || distanceStatus !== "All" || tagsInput;

  const resetFilters = useCallback(() => {
    setSearchTerm(""); setMinScore(""); setMinHealth(""); setMinRsi(""); setMaxRsi("");
    setMinDist(""); setMaxDist(""); setRsiZone("All"); setMarketCap("All"); setTrend("All");
    setSetupFilter("All"); setVolumeStrength("All"); setMomentumStatus("All"); setDistanceStatus("All"); setTagsInput("");
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchFinalSnapshot()
      .then(data => {
        setAllData(data);
        const uniqueDates = [...new Set(data.map(d => d.run_date))].sort().reverse();
        setDates(uniqueDates);
        if (uniqueDates.length > 0 && !selectedDate) setSelectedDate(uniqueDates[0]);
      })
      .catch(err => console.error("Error loading data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setIsCalOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredByDate = useMemo(() => {
    if (!selectedDate) return allData;
    return allData.filter(row => row.run_date === selectedDate);
  }, [allData, selectedDate]);

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
        if (rsiZone === "Healthy"    && (rsi < 40 || rsi > 60)) return false;
        if (rsiZone === "Oversold"   && rsi >= 40)               return false;
        if (rsiZone === "Overbought" && rsi <= 60)               return false;
      }
      if (trend !== "All" && !(row.trend_status || '').toLowerCase().includes(trend.toLowerCase())) return false;
      if (setupFilter !== "All" && row.setup_type !== setupFilter) return false;
      if (volumeStrength !== "All" && row.volume_strength !== volumeStrength) return false;
      if (momentumStatus !== "All" && (row.momentum_status || '').toLowerCase() !== momentumStatus.toLowerCase()) return false;
      if (distanceStatus !== "All" && row.distance_status !== distanceStatus) return false;
      if (tagsInput) {
        const filterTags = tagsInput.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
        const rowTags = (row.tags || '').split(',').map(t => t.trim().toUpperCase());
        if (!filterTags.every(ft => rowTags.includes(ft))) return false;
      }
      return true;
    });
  }, [filteredByDate, searchTerm, minScore, minHealth, minRsi, maxRsi, minDist, maxDist, rsiZone, trend, setupFilter, volumeStrength, momentumStatus, distanceStatus, tagsInput]);

  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>();
    filteredData.forEach(row => {
      if (row.tags) row.tags.split(",").map(t => t.trim()).filter(Boolean).forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [filteredData]);

  const bullishCount = useMemo(() =>
    filteredData.filter(r => (r.trend_status || '').toLowerCase().includes('bullish')).length,
  [filteredData]);

  const highConvCount = useMemo(() =>
    filteredData.filter(r => r.setup_type === 'HIGH_CONVICTION').length,
  [filteredData]);

  /* ── TABLE COLUMNS ── */
  const columns = useMemo(() => [
    columnHelper.display({
      id: "sno",
      header: "S.No",
      size: 48,
      cell: (info) => (
        <span className="font-mono text-slate-600 text-xs">{info.row.index + 1}</span>
      ),
    }),
    columnHelper.accessor("ticker", {
      header: "Asset",
      size: 180,
      cell: info => {
        const ticker = info.getValue();
        return (
          <div className="flex items-center gap-3">
            <TickerAvatar ticker={ticker} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-bold text-[13px] text-white tracking-wide leading-none">{ticker}</span>
              <span className="text-[9.5px] text-slate-500 font-medium uppercase tracking-wider">NSE · EQUITY</span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("ltp", {
      header: "LTP",
      size: 110,
      cell: info => (
        <span className="font-mono font-semibold text-[13px] text-slate-200">
          ₹{(info.getValue() || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    }),
    columnHelper.accessor("health_score", {
      header: "Health Score",
      size: 100,
      cell: info => <HealthBadge score={info.getValue()} />,
    }),
    columnHelper.accessor("trend_status", {
      header: "Trend",
      size: 140,
      cell: info => <TrendCell value={info.getValue() || 'Neutral'} />,
    }),
    columnHelper.accessor("momentum_status", {
      header: "Momentum",
      size: 120,
      cell: info => {
        const val = info.getValue() || 'Neutral';
        const norm = val.toLowerCase();
        const map: Record<string, string> = {
          bullish:  'text-emerald-400',
          hot:      'text-amber-400',
          recovery: 'text-blue-400',
          bearish:  'text-red-400',
          neutral:  'text-slate-500',
          healthy:  'text-cyan-400',
        };
        return (
          <span className={`font-semibold text-[11px] uppercase tracking-wide ${map[norm] || 'text-slate-400'}`}>
            {val}
          </span>
        );
      },
    }),
    columnHelper.accessor("rsi_14", {
      header: "RSI",
      size: 90,
      cell: info => <RsiCell rsi={info.getValue() || 0} />,
    }),
    columnHelper.accessor("weighted_avg", {
      header: "W.Avg",
      size: 120,
      cell: info => (
        <span className="font-mono text-[12px] text-slate-400">
          ₹{(info.getValue() || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    }),
    columnHelper.accessor("distance_pct", {
      header: "Dist %",
      size: 140,
      cell: info => {
        const row = info.row.original;
        return <DistCell pct={info.getValue() || 0} status={row.distance_status || ''} />;
      },
    }),
    columnHelper.accessor("volume_strength", {
      header: "Volume",
      size: 110,
      cell: info => <VolumeCell strength={info.getValue() || 'NORMAL'} />,
    }),
    columnHelper.accessor("swing_score", {
      header: "Swing Score",
      size: 110,
      cell: info => <SwingScoreBadge score={info.getValue() || 0} />,
    }),
    columnHelper.accessor("setup_type", {
      header: "Setup",
      size: 160,
      cell: info => <SetupBadge value={info.getValue() || 'NEUTRAL'} />,
    }),
    // ── TAGS COLUMN — colored pills, NOT plain text ──
    columnHelper.accessor("tags", {
      header: "Tags",
      size: 260,
      cell: info => <TagsCell tagsStr={info.getValue() || ""} />,
    }),
    // ── LINK COLUMN — Google Finance redirect ──
    columnHelper.display({
      id: "link",
      header: "Link",
      size: 56,
      cell: (info) => {
        const ticker = info.row.original.ticker;
        return (
          <a
            href={`https://www.google.com/finance/quote/${ticker}:NSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-800/60 border border-slate-700/40 hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-500 hover:text-blue-400 transition-all group"
            title={`Open ${ticker} on Google Finance`}
          >
            <ExternalLink size={13} className="group-hover:scale-110 transition-transform" />
          </a>
        );
      },
    }),
  ], []);

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
      ["#", "Symbol", "LTP", "Health", "Trend", "Momentum", "RSI", "W.Avg", "Dist%", "Vol", "Swing Score", "Setup", "Tags"].join(","),
      ...filteredData.map((row, idx) =>
        [idx + 1, row.ticker, row.ltp, row.health_score, row.trend_status, row.momentum_status,
         row.rsi_14, row.weighted_avg, row.distance_pct, row.volume_strength,
         row.swing_score, row.setup_type, (row.tags || "").replace(/,/g, ";")].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `swing_signals_${selectedDate}.csv`);
    link.click();
  }, [filteredData, selectedDate]);

  if (isLoading) {
    return (
      <div className="h-screen bg-[#080c12] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <div className="text-slate-500 font-mono text-xs uppercase tracking-widest">Loading market data...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#080c12] text-slate-200 flex flex-col" style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>

      {/* ─── TOPBAR ─── */}
      <header className="shrink-0 bg-[#0b1018] border-b border-white/[0.06] px-5 py-0 flex items-center justify-between h-12">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-black text-[13px] uppercase tracking-[0.15em] text-white">
              Swing<span className="text-blue-400">//</span>Logic
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-emerald-400/80">LIVE</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 mr-2">
            <StatChip label="Signals"    value={filteredData.length} />
            <StatChip label="Bullish"    value={bullishCount}  accent="bg-emerald-400" />
            <StatChip label="High Conv." value={highConvCount} accent="bg-blue-400" />
          </div>

          <div className="h-5 w-px bg-white/[0.06] mx-1" />

          {/* Date Picker */}
          <div className="relative" ref={calRef}>
            <button
              onClick={() => setIsCalOpen(!isCalOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] hover:border-white/[0.12] rounded-md text-[11px] font-mono tracking-wide transition-all text-slate-400 hover:text-slate-200 h-8"
            >
              <Calendar size={12} className="text-slate-500" />
              <span>{selectedDate || "Select Date"}</span>
              <ChevronDown size={11} className={`text-slate-600 transition-transform ${isCalOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCalOpen && (
              <div className="absolute right-0 mt-1.5 bg-[#0f1520] border border-white/[0.08] rounded-xl p-3 z-50 shadow-2xl shadow-black/60 w-60">
                <div className="text-[9.5px] font-mono text-slate-600 mb-2 uppercase tracking-widest px-1">
                  {dates.length} available snapshots
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
                  {dates.length > 0 ? dates.map(date => (
                    <button
                      key={date}
                      onClick={() => { setSelectedDate(date); setIsCalOpen(false); }}
                      className={`block w-full text-left px-3 py-2 text-[11px] font-mono rounded-lg transition-all ${
                        selectedDate === date
                          ? 'bg-blue-600/25 text-blue-300 border border-blue-500/30'
                          : 'hover:bg-white/[0.04] text-slate-400 border border-transparent hover:text-slate-200'
                      }`}
                    >
                      {date}
                    </button>
                  )) : (
                    <div className="text-slate-600 text-[10px] px-3 py-2">No snapshots available</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] hover:border-white/[0.12] rounded-md text-[11px] font-mono tracking-wide transition-all text-slate-400 hover:text-slate-200 h-8"
          >
            <Download size={12} className="text-slate-500" />
            <span className="uppercase">Export</span>
          </button>
        </div>
      </header>

      {/* ─── FILTER BAR ─── */}
      <div className="shrink-0 bg-[#0b1018] border-b border-white/[0.05] px-5 py-2 overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max">

          {/* Search */}
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-md px-3 py-1.5 focus-within:border-blue-500/40 transition-all w-40 h-8">
            <Search size={12} className="text-slate-600 shrink-0" />
            <input
              placeholder="Search symbol..."
              className="bg-transparent border-none outline-none text-slate-300 font-mono text-[11px] placeholder:text-slate-600 uppercase w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X size={11} />
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-white/[0.05]" />
          <FilterInput label="Score ≥"  value={minScore}  onChange={setMinScore}  placeholder="5"  type="number" width="w-12" />
          <div className="h-4 w-px bg-white/[0.05]" />
          <FilterInput label="Health ≥" value={minHealth} onChange={setMinHealth} placeholder="50" type="number" width="w-12" />
          <div className="h-4 w-px bg-white/[0.05]" />

          {/* RSI range */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-widest whitespace-nowrap">RSI</span>
            <input
              type="number"
              className="bg-[#0d1117] border border-slate-700/40 rounded-md outline-none px-2 py-1.5 w-11 text-slate-200 font-mono text-xs text-center placeholder:text-slate-600 focus:border-blue-500/50 transition-all"
              placeholder="Min" value={minRsi} onChange={e => setMinRsi(e.target.value)}
            />
            <span className="text-slate-700 text-[9px]">—</span>
            <input
              type="number"
              className="bg-[#0d1117] border border-slate-700/40 rounded-md outline-none px-2 py-1.5 w-11 text-slate-200 font-mono text-xs text-center placeholder:text-slate-600 focus:border-blue-500/50 transition-all"
              placeholder="Max" value={maxRsi} onChange={e => setMaxRsi(e.target.value)}
            />
          </div>

          <div className="h-4 w-px bg-white/[0.05]" />
          <FilterSelect label="Trend" value={trend} onChange={setTrend} options={[
            { value: "All",     label: "ALL"       },
            { value: "Bullish", label: "↑ BULLISH" },
            { value: "Bearish", label: "↓ BEARISH" },
          ]} />
          <div className="h-4 w-px bg-white/[0.05]" />
          <FilterSelect label="Setup" value={setupFilter} onChange={setSetupFilter} options={[
            { value: "All",              label: "ALL SETUPS"      },
            { value: "HIGH_CONVICTION",  label: "HIGH CONVICTION" },
            { value: "WATCHLIST",        label: "WATCHLIST"       },
            { value: "MOMENTUM_SETUP",   label: "MOMENTUM"        },
            { value: "WEAK_SETUP",       label: "WEAK SETUP"      },
          ]} />
          <div className="h-4 w-px bg-white/[0.05]" />
          <FilterSelect label="Mkt Cap" value={marketCap} onChange={setMarketCap} options={[
            { value: "All",   label: "ANY"   },
            { value: "Large", label: "LARGE" },
            { value: "Mid",   label: "MID"   },
            { value: "Small", label: "SMALL" },
            { value: "Micro", label: "MICRO" },
          ]} />
          <div className="h-4 w-px bg-white/[0.05]" />
          <FilterSelect label="Vol" value={volumeStrength} onChange={setVolumeStrength} options={[
            { value: "All",       label: "ALL"       },
            { value: "VERY_HIGH", label: "VERY HIGH" },
            { value: "HIGH",      label: "HIGH"      },
            { value: "NORMAL",    label: "NORMAL"    },
            { value: "LOW",       label: "LOW"       },
          ]} />
          <div className="h-4 w-px bg-white/[0.05]" />
          <FilterInput label="Tags" value={tagsInput} onChange={setTagsInput} placeholder="N50, PHARMA" type="text" width="w-28" />

          {hasActiveFilters && (
            <>
              <div className="h-4 w-px bg-white/[0.05]" />
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-600 hover:text-red-400 tracking-widest transition-colors"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── TABLE ─── */}
      <div className="flex-1 overflow-auto relative" style={{ background: 'linear-gradient(180deg, #0a0f18 0%, #080c12 100%)' }}>
        <table className="w-full text-left border-collapse min-w-[1700px]">
          <thead className="sticky top-0 z-20" style={{ background: '#0b1018' }}>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-white/[0.05]">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition-colors select-none group"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className={`transition-opacity ml-0.5 ${header.column.getIsSorted() ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
                          {{
                            asc:  <ChevronDown className="w-3 h-3 text-emerald-400 rotate-180" />,
                            desc: <ChevronDown className="w-3 h-3 text-red-400" />,
                          }[header.column.getIsSorted() as string] ?? <ChevronDown className="w-3 h-3" />}
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
              <tr
                key={row.id}
                className="border-b border-white/[0.03] hover:bg-white/[0.025] transition-colors group"
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3.5 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {table.getRowModel().rows.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-700">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Search size={20} className="opacity-40" />
            </div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em]">No signals match current filters</div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[10px] text-blue-400/70 hover:text-blue-400 font-mono uppercase tracking-widest transition-colors mt-1"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <div className="shrink-0 h-7 bg-[#0b1018] border-t border-white/[0.05] flex items-center justify-between px-5 text-[9.5px] font-mono text-slate-600 uppercase tracking-[0.14em]">
        <div className="flex items-center gap-3">
          <span className="text-slate-700">SwingLogic Quantitative Terminal</span>
          <span className="text-slate-800">v2.5</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            <span className="text-slate-400 font-semibold">{filteredData.length}</span>
            <span className="text-slate-700 ml-1">signals</span>
          </span>
          <span>
            <span className="text-slate-400 font-semibold">{allUniqueTags.length}</span>
            <span className="text-slate-700 ml-1">tags indexed</span>
          </span>
          {selectedDate && (
            <span>
              <span className="text-slate-700">snapshot</span>
              <span className="text-slate-500 ml-1">{selectedDate}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
