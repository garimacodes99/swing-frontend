import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://klacjppysecjsxkiuwfe.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_YmDIqjiei1uQvNSsvmJ-wQ_F27owGSJ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface StockMetric {
  // Core info
  id?: number;
  company_id?: number;
  ticker: string;
  run_date: string;
  
  // OHLCV
  open?: number;
  high?: number;
  low?: number;
  close: number;
  adj_close?: number;
  volume?: number;
  
  // Computed metrics
  ltp?: number;
  health_score?: number;
  tags?: string;
  
  // Trend
  trend_status?: string;
  sma_50?: number;
  sma_200?: number;
  
  // Momentum
  rsi_14?: number;
  momentum_status?: string;
  
  // Position
  weighted_avg?: number;
  distance_pct?: number;
  distance_status?: string;
  
  // Volume
  current_volume?: number;
  avg_volume_20d?: number;
  relative_volume?: number;
  volume_strength?: string;
  
  // Swing Score
  swing_score?: number;
  setup_type?: string;
}

/**
 * Fetch all daily metrics from Supabase
 */
export async function fetchFinalSnapshot(): Promise<StockMetric[]> {
  try {
    const { data, error } = await supabase
      .from("daily_metrics")
      .select(`
        id,
        company_id,
        run_date,
        open,
        high,
        low,
        close,
        adj_close,
        volume,
        ltp,
        trend_status,
        sma_50,
        sma_200,
        rsi_14,
        momentum_status,
        weighted_avg,
        distance_pct,
        distance_status,
        current_volume,
        avg_volume_20d,
        relative_volume,
        volume_strength,
        swing_score,
        setup_type,
        companies(ticker, health_score, tags)
      `)
      .order("run_date", { ascending: false })
      .order("swing_score", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(`Failed to load data: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn("No data returned from Supabase");
      return [];
    }

    // Transform and flatten data
    const transformedData: StockMetric[] = data.map((row: any) => ({
      id: row.id,
      company_id: row.company_id,
      ticker: row.companies?.ticker || "N/A",
      run_date: row.run_date,
      
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      adj_close: row.adj_close,
      volume: row.volume,
      
      ltp: row.ltp,
      health_score: row.companies?.health_score,
      tags: row.companies?.tags,
      
      trend_status: row.trend_status,
      sma_50: row.sma_50,
      sma_200: row.sma_200,
      
      rsi_14: row.rsi_14,
      momentum_status: row.momentum_status,
      
      weighted_avg: row.weighted_avg,
      distance_pct: row.distance_pct,
      distance_status: row.distance_status,
      
      current_volume: row.current_volume,
      avg_volume_20d: row.avg_volume_20d,
      relative_volume: row.relative_volume,
      volume_strength: row.volume_strength,
      
      swing_score: row.swing_score,
      setup_type: row.setup_type,
    }));

    console.log(`Loaded ${transformedData.length} metrics from daily_metrics`);
    return transformedData;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function fetchTickerDetails(ticker: string) {
  try {
    const { data, error } = await supabase
      .from("daily_metrics")
      .select(`
        *,
        companies(ticker, health_score, tags)
      `)
      .eq("companies.ticker", ticker)
      .order("run_date", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching details for ${ticker}:`, error);
    throw error;
  }
}

export async function fetchAvailableDates() {
  try {
    const { data, error } = await supabase
      .from("daily_metrics")
      .select("run_date")
      .order("run_date", { ascending: false });

    if (error) throw error;
    const uniqueDates = [...new Set(data?.map((d: any) => d.run_date) || [])];
    return uniqueDates;
  } catch (error) {
    console.error("Error fetching dates:", error);
    throw error;
  }
}
