import { create } from "zustand";
import type { ChainScope } from "@/types";

interface AppState {
  chainScope: ChainScope;
  tvlOverlayEnabled: boolean;
  ratioHistory: Array<{ timestamp: number; ratio: number }>;
  setChainScope: (scope: ChainScope) => void;
  setTvlOverlay: (enabled: boolean) => void;
  pushRatio: (value: { timestamp: number; ratio: number }) => void;
}

export const useAppStore = create<AppState>((set) => ({
  chainScope: "all",
  tvlOverlayEnabled: true,
  ratioHistory: [],
  setChainScope: (chainScope) => set({ chainScope }),
  setTvlOverlay: (tvlOverlayEnabled) => set({ tvlOverlayEnabled }),
  pushRatio: (value) =>
    set((state) => ({
      ratioHistory: [...state.ratioHistory.slice(-300), value]
    }))
}));
