import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WalletEntry } from "@/types";

interface WalletStore {
  viewedWallets: WalletEntry[];
  activeAddress: string | null;
  addOrUpdate: (entry: WalletEntry) => void;
  remove: (address: string) => void;
  clear: () => void;
  setActive: (address: string | null) => void;
  exportKey: () => string;
  importKey: (key: string) => boolean;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      viewedWallets: [],
      activeAddress: null,

      addOrUpdate: (entry) =>
        set((s) => {
          const idx = s.viewedWallets.findIndex((w) => w.address === entry.address);
          if (idx >= 0) {
            const updated = [...s.viewedWallets];
            updated[idx] = entry;
            return { viewedWallets: updated };
          }
          return { viewedWallets: [entry, ...s.viewedWallets].slice(0, 50) };
        }),

      remove: (address) =>
        set((s) => ({
          viewedWallets: s.viewedWallets.filter((w) => w.address !== address),
          activeAddress: s.activeAddress === address ? null : s.activeAddress
        })),

      clear: () => set({ viewedWallets: [], activeAddress: null }),

      setActive: (activeAddress) => set({ activeAddress }),

      exportKey: () => {
        const { viewedWallets } = get();
        const payload = JSON.stringify({ v: 1, viewedWallets, exportedAt: Date.now() });
        return btoa(unescape(encodeURIComponent(payload)));
      },

      importKey: (key) => {
        try {
          const payload = JSON.parse(decodeURIComponent(escape(atob(key.trim()))));
          if (!Array.isArray(payload.viewedWallets)) return false;
          set((s) => {
            const merged = [...payload.viewedWallets];
            for (const existing of s.viewedWallets) {
              if (!merged.find((w) => w.address === existing.address)) {
                merged.push(existing);
              }
            }
            return { viewedWallets: merged.slice(0, 50) };
          });
          return true;
        } catch {
          return false;
        }
      }
    }),
    { name: "btcvseth-wallets" }
  )
);
