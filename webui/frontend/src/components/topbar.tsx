import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Topbar({
  modelLabel,
  dataLabel,
}: {
  modelLabel: string;
  dataLabel: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b bg-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-baseline justify-between gap-2 px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="flex items-center gap-1.5 text-base font-bold tracking-tight">
            <Sparkles className="size-4 text-teal-400" />
            Kronos
          </span>
          <span className="text-xs text-slate-400">Financial Prediction</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="border-slate-700 bg-white/5 text-slate-200"
          >
            {modelLabel}
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-700 bg-white/5 text-slate-200"
          >
            {dataLabel}
          </Badge>
        </div>
      </div>
    </header>
  );
}
