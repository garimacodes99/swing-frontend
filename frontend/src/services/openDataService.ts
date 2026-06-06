import { createClient } from "@supabase/supabase-js";

// Supabase configuration (same as dataService)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://klacjppysecjsxkiuwfe.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_YmDIqjiei1uQvNSsvmJ-wQ_F27owGSJ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Fetch today's open/intraday snapshot from latest_metrics
 * Can be used for market open analysis
 */
export async function fetchOpenSnapshot() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("latest_metrics")
      .select("*")
      .eq("run_date", today)
      .order("swing_score", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(`Failed to fetch open snapshot: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn("No data available for today");
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error fetching open snapshot:", error);
    throw error;
  }
}

/**
 * Optional: Get previous day's closing data
 */
export async function fetchPreviousDaySnapshot() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("latest_metrics")
      .select("*")
      .eq("run_date", yesterdayStr)
      .order("swing_score", { ascending: false })
      .limit(500);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching previous day snapshot:", error);
    throw error;
  }
}

/**
 * Optional: Get comparison between open and close
 */
export async function fetchOpenCloseComparison() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const [todayData, yesterdayData] = await Promise.all([
      supabase.from("latest_metrics").select("*").eq("run_date", today),
      supabase.from("latest_metrics").select("*").eq("run_date", yesterdayStr),
    ]);

    if (todayData.error || yesterdayData.error) {
      throw new Error("Failed to fetch comparison data");
    }

    return {
      today: todayData.data || [],
      yesterday: yesterdayData.data || [],
    };
  } catch (error) {
    console.error("Error fetching open/close comparison:", error);
    throw error;
  }
}
