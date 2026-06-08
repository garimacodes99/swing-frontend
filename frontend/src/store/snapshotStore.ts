import { create } from "zustand";
import { fetchFinalSnapshot, type FinalSnapshotRow } from "../services/dataService";

interface SnapshotState {
  rows: FinalSnapshotRow[];
  loading: boolean;
  load: (date?: string) => Promise<void>;
}

export const useSnapshotStore = create<SnapshotState>((set) => ({
  rows: [],
  loading: false,

  load: async (date?: string) => {
    try {
      set({ loading: true });

      // Fetch all data from Supabase
      const allData = await fetchFinalSnapshot();

      if (!allData || allData.length === 0) {
        console.warn("No data returned from Supabase");
        set({ rows: [], loading: false });
        return;
      }

      // Filter by date if provided
      let filteredRows = allData;
      
      if (date) {
        filteredRows = allData.filter(row => row.date === date);
        console.log(`Loaded ${filteredRows.length} rows for date: ${date}`);
      } else {
        // If no date provided, get latest date data
        const latestDate = [...new Set(allData.map(d => d.date))].sort().reverse()[0];
        if (latestDate) {
          filteredRows = allData.filter(row => row.date === latestDate);
          console.log(`No date provided. Using latest date: ${latestDate}`);
        }
      }

      set({
        rows: filteredRows,
        loading: false,
      });

      console.log(`Successfully loaded ${filteredRows.length} rows from Supabase`);
    } catch (err) {
      console.error("Failed to load snapshot data from Supabase:", err);
      set({ rows: [], loading: false });
    }
  },
}));
