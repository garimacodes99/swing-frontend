import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://klacjppysecjsxkiuwfe.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_YmDIqjiei1uQvNSsvmJ-wQ_F27owGSJ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface FinalSnapshotRow {
  ticker: string;
  date: string;
  session: "OPEN" | "CLOSE";

  entry_close: number;

  rsi: number;
  atr: number;
  atr_pct: number;

  sma_50: number;
  sma_200: number;

  trend_status: string;
  volatility_class: string;

  past_1m_pct: number;
  past_3m_pct: number;
  past_6m_pct: number;

  swing_score: number;
  swing_label: string;
}

/**
 * Fetch latest metrics from Supabase
 * Transforms database columns to match FinalSnapshotRow interface
 */
export async function fetchFinalSnapshot(): Promise<FinalSnapshotRow[]> {
  try {
    const { data, error } = await supabase
      .from("latest_metrics")
      .select("*")
      .order("swing_score", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(`Failed to load final snapshot: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn("No data returned from Supabase");
      return [];
    }

    // Transform database rows to FinalSnapshotRow format
    const transformedData: FinalSnapshotRow[] = data.map((row: any) => ({
      ticker: row.ticker || "N/A",
      date: row.run_date || new Date().toISOString().split("T")[0],
      session: "CLOSE", // Default to CLOSE since we're using daily data

      // Price data
      entry_close: parseFloat(row.close) || 0,

      // Technical indicators
      rsi: parseFloat(row.rsi_14) || 0,
      atr: parseFloat(row.close) || 0, // Using close as proxy if ATR not available
      atr_pct: 0, // Calculate if needed

      // Moving averages
      sma_50: parseFloat(row.sma_50) || 0,
      sma_200: parseFloat(row.sma_200) || 0,

      // Status fields
      trend_status: row.trend_status || "UNKNOWN",
      volatility_class: row.volume_strength || "NORMAL",

      // Performance metrics (defaults - can be calculated from historical data)
      past_1m_pct: 0,
      past_3m_pct: 0,
      past_6m_pct: 0,

      // Swing analysis
      swing_score: parseInt(row.swing_score) || 0,
      swing_label: row.setup_type || "NEUTRAL",
    }));

    return transformedData.sort((a, b) => b.swing_score - a.swing_score);
  } catch (error) {
    console.error("Error fetching final snapshot:", error);
    throw error;
  }
}

/**
 * Optional: Fetch specific ticker details
 */
export async function fetchTickerDetails(ticker: string) {
  try {
    const { data, error } = await supabase
      .from("daily_metrics")
      .select("*")
      .eq("ticker", ticker)
      .order("run_date", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching details for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Optional: Real-time subscription to latest metrics
 */
export function subscribeToLatestMetrics(callback: (data: FinalSnapshotRow[]) => void) {
  const subscription = supabase
    .from("latest_metrics")
    .on("*", async (payload) => {
      console.log("Realtime update:", payload);
      const data = await fetchFinalSnapshot();
      callback(data);
    })
    .subscribe();

  return subscription;
}
