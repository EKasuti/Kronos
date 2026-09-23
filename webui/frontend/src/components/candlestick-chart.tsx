"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/types";

function toLwc(data: Candle[]) {
  return data.map((c) => ({ ...c, time: c.time as UTCTimestamp }));
}

export function CandlestickChart({
  historical,
  prediction,
  actual,
}: {
  historical: Candle[];
  prediction: Candle[];
  actual: Candle[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#475569",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#e2e8f0" },
        horzLines: { color: "#e2e8f0" },
      },
      rightPriceScale: { borderColor: "#e2e8f0" },
      timeScale: { borderColor: "#e2e8f0", timeVisible: true, secondsVisible: false },
      height: 520,
      width: container.clientWidth,
    });
    chartRef.current = chart;

    const historicalSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#0f766e",
      downColor: "#dc2626",
      borderVisible: false,
      wickUpColor: "#0f766e",
      wickDownColor: "#dc2626",
      title: "Historical",
    });
    historicalSeries.setData(toLwc(historical));

    if (prediction.length > 0) {
      const predictionSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#65a30d",
        downColor: "#ea580c",
        borderVisible: false,
        wickUpColor: "#65a30d",
        wickDownColor: "#ea580c",
        title: "Prediction",
      });
      predictionSeries.setData(toLwc(prediction));
    }

    if (actual.length > 0) {
      const actualSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#c026d3",
        downColor: "#4338ca",
        borderVisible: false,
        wickUpColor: "#c026d3",
        wickDownColor: "#4338ca",
        title: "Actual",
      });
      actualSeries.setData(toLwc(actual));
    }

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [historical, prediction, actual]);

  return <div ref={containerRef} className="w-full" />;
}
