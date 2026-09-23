import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PredictResponse } from "@/lib/types";

export function ForecastSummary({ result }: { result: PredictResponse }) {
  const preds = result.prediction_results;
  if (!preds || preds.length === 0) return null;

  const lastKnown = result.last_known_close;
  const endPrice = preds[preds.length - 1].close;
  const change = endPrice - lastKnown;
  const pctChange = (change / lastKnown) * 100;

  const rangeLow = Math.min(...preds.map((p) => p.low));
  const rangeHigh = Math.max(...preds.map((p) => p.high));

  const direction =
    pctChange > 0.1 ? "up" : pctChange < -0.1 ? "down" : "flat";
  const DirectionIcon =
    direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;

  const hasActual = result.has_comparison && result.actual_data.length > 0;
  const actualEnd = hasActual
    ? result.actual_data[result.actual_data.length - 1].close
    : null;
  const errPct =
    actualEnd != null ? Math.abs((endPrice - actualEnd) / actualEnd) * 100 : null;

  return (
    <div className="mb-4 rounded-lg border bg-muted/40 p-4">
      <div
        className={cn(
          "mb-3 flex items-center gap-1.5 text-sm font-bold",
          direction === "up" && "text-emerald-600",
          direction === "down" && "text-red-600",
          direction === "flat" && "text-muted-foreground",
        )}
      >
        <DirectionIcon className="size-4" />
        {direction === "up" && "Predicted Up"}
        {direction === "down" && "Predicted Down"}
        {direction === "flat" && "Flat"}
        <span>
          {pctChange >= 0 ? "+" : ""}
          {pctChange.toFixed(2)}% over the forecast window
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <SummaryStat label="Last Known Price" value={lastKnown.toFixed(4)} />
        <SummaryStat
          label={hasActual ? "Predicted End Price" : "Forecast End Price"}
          value={endPrice.toFixed(4)}
        />
        <SummaryStat
          label="Change"
          value={`${change >= 0 ? "+" : ""}${change.toFixed(4)} (${
            pctChange >= 0 ? "+" : ""
          }${pctChange.toFixed(2)}%)`}
          tone={direction}
        />
        <SummaryStat
          label="Forecast Range (low–high)"
          value={`${rangeLow.toFixed(4)} – ${rangeHigh.toFixed(4)}`}
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {hasActual && actualEnd != null && errPct != null
          ? `Backtest — what actually happened: ${actualEnd.toFixed(4)} (the model's final-candle prediction was off by ${errPct.toFixed(2)}%)`
          : "Live forecast — this period has not happened yet, so there is nothing to compare against."}
      </p>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "flat";
}) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <strong
        className={cn(
          "block text-lg font-bold",
          tone === "up" && "text-emerald-600",
          tone === "down" && "text-red-600",
        )}
      >
        {value}
      </strong>
    </div>
  );
}
