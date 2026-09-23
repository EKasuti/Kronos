"use client";

import { useState } from "react";
import { LineChart } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { ModelTab } from "@/components/model-tab";
import { SourcesTab } from "@/components/sources-tab";
import { PredictTab } from "@/components/predict-tab";
import { CandlestickChart } from "@/components/candlestick-chart";
import { ForecastSummary } from "@/components/forecast-summary";
import { ComparisonTable } from "@/components/comparison-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModelStatus } from "@/lib/hooks";
import type { PredictResponse } from "@/lib/types";

export default function Home() {
  const { data: modelStatus } = useModelStatus();
  const [dataFile, setDataFile] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);

  const modelLabel = modelStatus?.loaded
    ? `Model: ${modelStatus.model_name ?? "loaded"}`
    : "Model: not loaded";
  const dataLabel = dataFile
    ? `Data: ${dataFile.split("/").pop()}`
    : "Data: none";

  return (
    <div className="flex flex-1 flex-col">
      <Topbar modelLabel={modelLabel} dataLabel={dataLabel} />

      <div className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-5 p-5 lg:grid-cols-[380px_1fr]">
        <div className="h-fit rounded-lg border bg-card shadow-sm">
          <Tabs defaultValue="predict">
            <TabsList className="w-full rounded-b-none">
              <TabsTrigger value="predict">Predict</TabsTrigger>
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="sources">Data Sources</TabsTrigger>
            </TabsList>

            <TabsContent value="predict" className="p-4">
              <PredictTab onResult={setResult} onFileChange={setDataFile} />
            </TabsContent>
            <TabsContent value="model" className="p-4">
              <ModelTab />
            </TabsContent>
            <TabsContent value="sources" className="p-4">
              <SourcesTab />
            </TabsContent>
          </Tabs>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-1.5 text-base font-bold">
            <LineChart className="size-4.5" />
            Prediction Results
          </h2>

          {result ? (
            <>
              <ForecastSummary result={result} />
              <CandlestickChart
                historical={result.series.historical}
                prediction={result.series.prediction}
                actual={result.series.actual}
              />
              {result.has_comparison && result.actual_data.length > 0 && (
                <div className="mt-5 border-t pt-4">
                  <h3 className="mb-3 text-sm font-bold">
                    Prediction vs Actual Data Comparison
                  </h3>
                  <ComparisonTable
                    predictions={result.prediction_results}
                    actuals={result.actual_data}
                  />
                </div>
              )}
            </>
          ) : (
            <p className="py-24 text-center text-sm text-muted-foreground">
              Load a model and data file, then run a Backtest or Live
              Forecast to see results here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
