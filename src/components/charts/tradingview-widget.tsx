"use client";

import { useEffect, useRef } from "react";

export interface TradingViewWidgetProps {
  symbol?: string;
  interval?: string;
  height?: number;
  studies?: string[];
  style?: "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
  allowSymbolChange?: boolean;
  showPopupButton?: boolean;
}

const DEFAULT_STUDIES = [
  "Volume@tv-basicstudies",
  "RSI@tv-basicstudies",
  "MACD@tv-basicstudies"
];

export function TradingViewWidget({
  symbol = "BINANCE:BTCETH",
  interval = "60",
  height = 520,
  studies = DEFAULT_STUDIES,
  style = "1",
  allowSymbolChange = true,
  showPopupButton = true
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget
    container.innerHTML = "";

    // TradingView requires a child div for the iframe
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    // Config is passed as the textContent of the script tag per TradingView docs
    script.textContent = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme: "dark",
      style,
      locale: "en",
      backgroundColor: "rgba(10,12,24,1)",
      gridColor: "rgba(255,255,255,0.04)",
      allow_symbol_change: allowSymbolChange,
      calendar: false,
      studies,
      save_image: true,
      show_popup_button: showPopupButton,
      popup_width: "1200",
      popup_height: "700",
      hide_top_toolbar: false,
      hide_legend: false,
      withdateranges: true,
      range: "3M",
      support_host: "https://www.tradingview.com"
    });

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  // stringify studies to get stable dep value
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, interval, style, showPopupButton, allowSymbolChange, JSON.stringify(studies)]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full overflow-hidden"
      style={{ height }}
    />
  );
}
