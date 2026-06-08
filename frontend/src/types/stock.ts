// Complete Stock Metric Type - matches Supabase schema
export interface StockMetric {
  // Core identifiers
  id?: number;
  company_id?: number;
  ticker: string;
  run_date: string;
  
  // OHLCV data
  open?: number;
  high?: number;
  low?: number;
  close: number;
  adj_close?: number;
  volume?: number;
  
  // Company metadata
  ltp?: number;
  health_score?: number;
  tags?: string;
  
  // Trend metrics
  trend_status?: string;
  sma_50?: number;
  sma_200?: number;
  
  // Momentum metrics
  rsi_14?: number;
  momentum_status?: string;
  
  // Position metrics
  weighted_avg?: number;
  distance_pct?: number;
  distance_status?: string;
  
  // Volume metrics
  current_volume?: number;
  avg_volume_20d?: number;
  relative_volume?: number;
  volume_strength?: string;
  
  // Swing analysis
  swing_score?: number;
  setup_type?: string;
}

// Legacy type for backward compatibility
export type Stock = {
  symbol?: string;
  Open?: number;
  High?: number;
  Low?: number;
  Close?: number;
  Volume?: number;
};
