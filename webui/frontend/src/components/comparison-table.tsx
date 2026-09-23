import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PredictionPoint } from "@/lib/types";

interface Row {
  time: string;
  actualOpen: number;
  predOpen: number;
  actualHigh: number;
  predHigh: number;
  actualLow: number;
  predLow: number;
  actualClose: number;
  predClose: number;
}

const COLUMNS: { key: keyof Row; header: string }[] = [
  { key: "time", header: "Time" },
  { key: "actualOpen", header: "Actual Open" },
  { key: "predOpen", header: "Predicted Open" },
  { key: "actualHigh", header: "Actual High" },
  { key: "predHigh", header: "Predicted High" },
  { key: "actualLow", header: "Actual Low" },
  { key: "predLow", header: "Predicted Low" },
  { key: "actualClose", header: "Actual Close" },
  { key: "predClose", header: "Predicted Close" },
];

export function ComparisonTable({
  predictions,
  actuals,
}: {
  predictions: PredictionPoint[];
  actuals: PredictionPoint[];
}) {
  const rows = useMemo<Row[]>(() => {
    const n = Math.min(predictions.length, actuals.length);
    return Array.from({ length: n }, (_, i) => {
      const p = predictions[i];
      const a = actuals[i];
      return {
        time: new Date(p.timestamp).toLocaleString(),
        actualOpen: a.open,
        predOpen: p.open,
        actualHigh: a.high,
        predHigh: p.high,
        actualLow: a.low,
        predLow: p.low,
        actualClose: a.close,
        predClose: p.close,
      };
    });
  }, [predictions, actuals]);

  return (
    <ScrollArea className="h-[300px] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead key={col.key} className="text-center text-xs">
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {COLUMNS.map((col) => (
                <TableCell key={col.key} className="text-center text-xs">
                  {col.key === "time"
                    ? row.time
                    : (row[col.key] as number).toFixed(4)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
