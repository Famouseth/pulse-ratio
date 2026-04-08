"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCoinGeckoMarket } from "@/lib/market-api";
import { useAppStore } from "@/store/use-app-store";

interface BinanceTickerMessage {
  s: string;
  c: string;
}

export function useMarketData() {
  const [livePrice, setLivePrice] = useState<{ BTC?: number; ETH?: number }>({});
  const pushRatio = useAppStore((s) => s.pushRatio);

  const marketQuery = useQuery({
    queryKey: ["market", "coingecko"],
    queryFn: fetchCoinGeckoMarket,
    refetchInterval: 10_000
  });

  useEffect(() => {
    const socket = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker");

    socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as { data: BinanceTickerMessage };
      const symbol = parsed.data.s;
      const price = Number(parsed.data.c);
      if (!Number.isFinite(price)) return;

      setLivePrice((prev) => {
        const next = { ...prev };
        if (symbol === "BTCUSDT") next.BTC = price;
        if (symbol === "ETHUSDT") next.ETH = price;

        if (next.BTC && next.ETH) {
          pushRatio({ timestamp: Date.now(), ratio: next.BTC / next.ETH });
        }

        return next;
      });
    };

    return () => {
      socket.close();
    };
  }, [pushRatio]);

  const merged = useMemo(() => {
    const data = marketQuery.data;
    if (!data) return null;

    return {
      BTC: {
        ...data.BTC,
        price: livePrice.BTC ?? data.BTC.price
      },
      ETH: {
        ...data.ETH,
        price: livePrice.ETH ?? data.ETH.price
      }
    };
  }, [livePrice.BTC, livePrice.ETH, marketQuery.data]);

  return {
    ...marketQuery,
    data: merged
  };
}
