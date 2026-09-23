"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";

const WINDOW_SIZE = 520; // 400 lookback + 120 prediction, fixed

export interface TimeWindowSliderProps {
  totalRows: number;
  startDate: Date;
  endDate: Date;
  onWindowChange: (startDate: Date) => void;
}

function rowToDate(row: number, totalRows: number, startDate: Date, endDate: Date) {
  const totalMs = endDate.getTime() - startDate.getTime();
  const frac = totalRows > 1 ? row / (totalRows - 1) : 0;
  return new Date(startDate.getTime() + totalMs * frac);
}

export function TimeWindowSlider({
  totalRows,
  startDate,
  endDate,
  onWindowChange,
}: TimeWindowSliderProps) {
  const maxRow = Math.max(totalRows - 1, WINDOW_SIZE);
  const defaultStart = Math.max(0, totalRows - WINDOW_SIZE);
  const [range, setRange] = useState<[number, number]>([
    defaultStart,
    defaultStart + WINDOW_SIZE,
  ]);

  // Default to the most recent window whenever a new file is loaded, so
  // predictions use the latest available data instead of stale candles.
  useEffect(() => {
    const start = Math.max(0, totalRows - WINDOW_SIZE);
    setRange([start, start + WINDOW_SIZE]);
    onWindowChange(rowToDate(start, totalRows, startDate, endDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalRows]);

  function handleValueChange(
    value: number | readonly number[],
    eventDetails: { activeThumbIndex?: number },
  ) {
    const idx = eventDetails.activeThumbIndex ?? 0;
    let [start, end] = value as number[];
    if (idx === 0) {
      start = Math.min(start, maxRow - WINDOW_SIZE);
      end = start + WINDOW_SIZE;
    } else {
      end = Math.max(end, WINDOW_SIZE);
      start = end - WINDOW_SIZE;
    }
    setRange([start, end]);
    onWindowChange(rowToDate(start, totalRows, startDate, endDate));
  }

  const windowStart = rowToDate(range[0], totalRows, startDate, endDate);
  const windowEnd = rowToDate(range[1], totalRows, startDate, endDate);

  if (totalRows < WINDOW_SIZE) {
    return (
      <p className="text-xs text-destructive">
        Insufficient data: need at least {WINDOW_SIZE} rows, only {totalRows}{" "}
        available.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-muted-foreground">
        <span>Start: {windowStart.toLocaleDateString()}</span>
        <span>End: {windowEnd.toLocaleDateString()}</span>
      </div>
      <Slider
        min={0}
        max={maxRow}
        value={range}
        onValueChange={handleValueChange}
        minStepsBetweenValues={WINDOW_SIZE}
      />
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{startDate.toLocaleDateString()}</span>
        <span>{endDate.toLocaleDateString()}</span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Window Size: 400 + 120 = 520 data points (fixed). Used for Backtest
        only — Live Forecast always uses the most recent data.
      </p>
    </div>
  );
}
