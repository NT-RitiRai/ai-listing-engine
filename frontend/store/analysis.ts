import { create } from "zustand";

interface AnalysisStore {
  analysisId: string | null;
  status: string | null;
  url: string | null;
  setAnalysis: (id: string, url: string) => void;
  setStatus: (status: string) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  analysisId: null,
  status: null,
  url: null,
  setAnalysis: (id, url) => set({ analysisId: id, url, status: "pending" }),
  setStatus: (status) => set({ status }),
  reset: () => set({ analysisId: null, status: null, url: null }),
}));
