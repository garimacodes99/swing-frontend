import { create } from "zustand";
import { fetchFinalSnapshot, type FinalSnapshotRow } from "../services/dataService";

/**
 * CloseRow - Direct mapping from Supabase FinalSnapshotRow
 * No transformation needed, use data as-is
 */
export type CloseRow = FinalSnapshotRow;

type CloseState = {
  rows: CloseRow[];
  symbol: string;
  loading: boolean;
  load: (symbol?: string) => Promise<void>;
};

export const useCloseStore = create<CloseState>((set) => ({
  rows: [],
  symbol: "INFY",
  loading: false,

  load: async (symbol = "INFY") => {
    try {
      set({ loading: true });

      // ✅ Fetch from Supabase
      const allData = await fetchFinalSnapshot();

      if (!allData || allData.length === 0) {
        console.warn("No data returned from Supabase");
        set({ rows: [], symbol, loading: false });
        return;
      }

      // ✅ Filter by symbol (case-insensitive)
      const filteredRows = allData.filter(
        (r) => r.ticker.toUpperCase() === symbol.toUpperCase()
      );

      console.log(
        `Loaded ${filteredRows.length} rows for symbol: ${symbol}`,
        filteredRows
      );

      set({
        rows: filteredRows,
        symbol: symbol.toUpperCase(),
        loading: false,
      });
    } catch (err) {
      console.error(`Failed to load data for symbol ${symbol}:`, err);
      set({ rows: [], symbol, loading: false });
    }
  },
}));
