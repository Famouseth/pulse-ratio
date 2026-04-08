"use client";

import { useEffect, useRef } from "react";
import { createChart, type IChartApi, type ISeriesApi } from "lightweight-charts";

interface Props {
  points: Array<{ time: number; value: number }>;
}

export function PriceRatioChart({ points }: Props) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = createChart(chartRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#a8b3cf"
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" }
      },
      width: chartRef.current.clientWidth,
      height: 280,
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)"
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.1)"
      }
    });

    const series = chart.addLineSeries({
      color: "#06D6A0",
      lineWidth: 2
    });

    apiRef.current = chart;
    seriesRef.current = series;

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: chartRef.current?.clientWidth ?? 500 });
    });
    observer.observe(chartRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(points.map((point) => ({ time: Math.floor(point.time / 1000) as never, value: point.value })));
  }, [points]);

  return <div ref={chartRef} className="w-full" />;
}
