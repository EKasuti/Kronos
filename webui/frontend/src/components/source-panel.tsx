"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AutoRefreshStatus, SymbolMap } from "@/lib/types";

export function SourcePanel({
  title,
  symbols,
  defaultSymbols,
  autoRefreshStatus,
  isRefreshing,
  onRefresh,
  onSetAutoRefresh,
  hint,
}: {
  title: string;
  symbols: SymbolMap;
  defaultSymbols: string[];
  autoRefreshStatus?: AutoRefreshStatus;
  isRefreshing: boolean;
  onRefresh: (symbols: string[]) => void;
  onSetAutoRefresh: (enabled: boolean, intervalMinutes: number, symbols: string[]) => void;
  hint: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSymbols));
  const [interval, setIntervalMinutes] = useState(
    autoRefreshStatus?.interval_minutes ?? 15,
  );

  function toggleSymbol(symbol: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(symbol);
      else next.delete(symbol);
      return next;
    });
  }

  function handleRefresh() {
    if (selected.size === 0) {
      toast.error("Select at least one symbol to fetch");
      return;
    }
    onRefresh(Array.from(selected));
  }

  function handleAutoRefreshToggle(checked: boolean) {
    if (checked && selected.size === 0) {
      toast.error("Select at least one symbol before enabling auto-refresh");
      return;
    }
    onSetAutoRefresh(checked, interval, Array.from(selected));
  }

  return (
    <div className="space-y-3 border-t pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>

      <div className="space-y-1.5">
        {Object.entries(symbols).map(([symbol, label]) => (
          <label
            key={symbol}
            className="flex items-center gap-2 text-sm font-normal"
          >
            <Checkbox
              checked={selected.has(symbol)}
              onCheckedChange={(checked) => toggleSymbol(symbol, checked === true)}
            />
            {symbol} ({label})
          </label>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{hint}</p>

      <Button
        variant="secondary"
        className="w-full"
        disabled={isRefreshing}
        onClick={handleRefresh}
      >
        <Download className="size-4" />
        Fetch Latest Now
      </Button>

      <div className="flex flex-wrap items-center gap-2 pt-1 text-sm">
        <Switch
          checked={autoRefreshStatus?.running ?? false}
          onCheckedChange={handleAutoRefreshToggle}
        />
        <Label>Auto-refresh every</Label>
        <Input
          type="number"
          min={5}
          max={1440}
          value={interval}
          onChange={(e) => setIntervalMinutes(Number(e.target.value) || 15)}
          className="w-16"
        />
        <span>min</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {autoRefreshStatus?.running
          ? `Auto-refresh: ON (every ${autoRefreshStatus.interval_minutes} min)${
              autoRefreshStatus.last_run
                ? ` — last: ${new Date(autoRefreshStatus.last_run).toLocaleTimeString()}`
                : ""
            }${
              autoRefreshStatus.next_run
                ? `, next: ${new Date(autoRefreshStatus.next_run).toLocaleTimeString()}`
                : ""
            }`
          : "Auto-refresh: off"}
      </p>
    </div>
  );
}
