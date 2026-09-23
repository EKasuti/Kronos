"use client";

import { useState } from "react";
import { FolderOpen, Rocket, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeWindowSlider } from "@/components/time-window-slider";
import {
  useBacktest,
  useDataFiles,
  useLiveForecast,
  useLoadData,
  useModelStatus,
} from "@/lib/hooks";
import type { DataInfo, PredictResponse } from "@/lib/types";

const LOOKBACK = 400;
const PRED_LEN = 120; // fixed for Backtest - the time-window slider assumes a 520-row window

const HORIZON_PRESETS = [
  { label: "10h", steps: 120 },
  { label: "1d", steps: 288 },
];

// Backend timestamps are naive UTC. A plain `new Date(...)` on a string with
// no timezone suffix is parsed as LOCAL time by the browser, silently
// shifting every downstream calculation by the viewer's UTC offset.
function parseUTCDate(str: string) {
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(str)) return new Date(str);
  return new Date(str + "Z");
}

export function PredictTab({
  onResult,
  onFileChange,
}: {
  onResult: (result: PredictResponse) => void;
  onFileChange: (path: string | null) => void;
}) {
  const { data: files } = useDataFiles();
  const { data: modelStatus } = useModelStatus();
  const loadData = useLoadData();
  const backtest = useBacktest();
  const liveForecast = useLiveForecast();

  const [filePath, setFilePath] = useState<string>("");
  const [dataInfo, setDataInfo] = useState<DataInfo | null>(null);
  const [windowStart, setWindowStart] = useState<Date | null>(null);
  const [temperature, setTemperature] = useState(1.0);
  const [topP, setTopP] = useState(0.9);
  const [sampleCount, setSampleCount] = useState(1);
  const [liveHorizon, setLiveHorizon] = useState(120);

  const modelLoaded = modelStatus?.loaded ?? false;
  const canPredict = modelLoaded && !!filePath && !!dataInfo;

  function handleLoadData() {
    if (!filePath) {
      toast.error("Please select a data file to load");
      return;
    }
    loadData.mutate(filePath, {
      onSuccess: (res) => {
        setDataInfo(res.data_info);
        onFileChange(filePath);
        toast.success(res.message);
      },
      onError: (err) => toast.error(`Data loading failed: ${err.message}`),
    });
  }

  function handleBacktest() {
    if (!canPredict || !dataInfo || !windowStart) {
      toast.error("Load data and a model first");
      return;
    }
    backtest.mutate(
      {
        file_path: filePath,
        lookback: LOOKBACK,
        pred_len: PRED_LEN,
        start_date: windowStart.toISOString().slice(0, 16),
        temperature,
        top_p: topP,
        sample_count: sampleCount,
      },
      {
        onSuccess: (res) => {
          onResult(res);
          toast.success(res.message);
        },
        onError: (err) => toast.error(`Prediction failed: ${err.message}`),
      },
    );
  }

  function handleLiveForecast() {
    if (!canPredict) {
      toast.error("Load data and a model first");
      return;
    }
    liveForecast.mutate(
      {
        file_path: filePath,
        lookback: LOOKBACK,
        pred_len: liveHorizon,
        temperature,
        top_p: topP,
        sample_count: sampleCount,
      },
      {
        onSuccess: (res) => {
          onResult(res);
          toast.success(res.message);
        },
        onError: (err) => toast.error(`Live forecast failed: ${err.message}`),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Data file</Label>
        <Select value={filePath} onValueChange={(v) => setFilePath(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Please select data file" />
          </SelectTrigger>
          <SelectContent>
            {files?.map((f) => (
              <SelectItem key={f.path} value={f.path}>
                {f.name} ({f.size})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        disabled={loadData.isPending}
        onClick={handleLoadData}
      >
        <FolderOpen className="size-4" />
        Load Data
      </Button>

      {dataInfo && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3">
          <InfoField label="Rows" value={String(dataInfo.rows)} />
          <InfoField label="Columns" value={String(dataInfo.columns.length)} />
          <InfoField label="Frequency" value={dataInfo.timeframe} />
          <InfoField
            label="Price Range"
            value={`${dataInfo.price_range.min.toFixed(4)} - ${dataInfo.price_range.max.toFixed(4)}`}
          />
          <InfoField
            className="col-span-2"
            label="Time Range"
            value={`${dataInfo.start_date} to ${dataInfo.end_date}`}
          />
          <InfoField
            className="col-span-2"
            label="Prediction Columns"
            value={dataInfo.prediction_columns.join(", ")}
          />
        </div>
      )}

      {dataInfo && (
        <div className="space-y-2 border-t pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            ⏰ Time Window (Backtest)
          </h3>
          <TimeWindowSlider
            totalRows={dataInfo.rows}
            startDate={parseUTCDate(dataInfo.start_date)}
            endDate={parseUTCDate(dataInfo.end_date)}
            onWindowChange={setWindowStart}
          />
        </div>
      )}

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          🎛️ Quality Parameters
        </h3>
        <div className="space-y-1.5">
          <Label>Temperature (T)</Label>
          <div className="flex items-center gap-2.5">
            <Slider
              value={[temperature]}
              min={0.1}
              max={2.0}
              step={0.1}
              onValueChange={(v) => setTemperature((v as number[])[0])}
            />
            <span className="w-9 text-right text-sm font-bold text-teal-700">
              {temperature.toFixed(1)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Higher = more diverse predictions, lower = more conservative
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Nucleus Sampling (top_p)</Label>
          <div className="flex items-center gap-2.5">
            <Slider
              value={[topP]}
              min={0.1}
              max={1.0}
              step={0.1}
              onValueChange={(v) => setTopP((v as number[])[0])}
            />
            <span className="w-9 text-right text-sm font-bold text-teal-700">
              {topP.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Sample Count</Label>
          <Input
            type="number"
            min={1}
            max={5}
            value={sampleCount}
            onChange={(e) => setSampleCount(Number(e.target.value) || 1)}
          />
          <p className="text-[11px] text-muted-foreground">
            Average multiple forecast paths (recommended 1-3)
          </p>
        </div>
      </div>

      <div className="space-y-1.5 border-t pt-4">
        <Label>Live Forecast Horizon</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={20000}
            value={liveHorizon}
            onChange={(e) => setLiveHorizon(Number(e.target.value) || 120)}
            className="w-24"
          />
          <span className="text-xs text-muted-foreground">
            candles (5 min each)
          </span>
        </div>
        <div className="flex gap-1.5">
          {HORIZON_PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              variant={liveHorizon === p.steps ? "default" : "outline"}
              size="sm"
              onClick={() => setLiveHorizon(p.steps)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          ≈ {(liveHorizon / 12).toFixed(1)} hours out ({(liveHorizon / 288).toFixed(2)} days).
          Accuracy degrades sharply beyond ~120 candles (10h) since the model
          starts generating off its own earlier output instead of real data —
          and long horizons take proportionally longer to compute.
        </p>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={!canPredict || backtest.isPending}
            onClick={handleBacktest}
          >
            <Rocket className="size-4" />
            Backtest
          </Button>
          <Button
            className="flex-1 bg-amber-700 hover:bg-amber-800"
            disabled={!canPredict || liveForecast.isPending}
            onClick={handleLiveForecast}
          >
            <Sparkles className="size-4" />
            Live Forecast
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Backtest checks accuracy on a fixed 400+120 window with known
          outcomes. Live Forecast predicts the horizon above beyond your
          latest data — no ground truth exists yet.
        </p>
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <strong className="block break-words text-sm font-semibold">
        {value}
      </strong>
    </div>
  );
}
