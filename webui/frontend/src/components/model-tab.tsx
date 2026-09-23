"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAvailableModels, useLoadModel, useModelStatus } from "@/lib/hooks";

export function ModelTab() {
  const { data: modelsData } = useAvailableModels();
  const { data: status } = useModelStatus();
  const loadModel = useLoadModel();

  const [modelKey, setModelKey] = useState("");
  const [device, setDevice] = useState("cpu");

  // Restore last-picked model/device from this browser, and reflect a model
  // already loaded in the backend process (true on a plain page refresh)
  // without requiring the user to click "Load Model" again.
  useEffect(() => {
    const savedModel = localStorage.getItem("kronos_model_key");
    const savedDevice = localStorage.getItem("kronos_device");
    if (savedModel) setModelKey(savedModel);
    if (savedDevice) setDevice(savedDevice);
  }, []);

  useEffect(() => {
    if (status?.loaded && status.model_key) {
      setModelKey(status.model_key);
    }
  }, [status?.loaded, status?.model_key]);

  function handleLoad() {
    if (!modelKey) {
      toast.error("Please select a model to load");
      return;
    }
    loadModel.mutate(
      { modelKey, device },
      {
        onSuccess: (res) => {
          localStorage.setItem("kronos_model_key", modelKey);
          localStorage.setItem("kronos_device", device);
          toast.success(res.message);
        },
        onError: (err) => toast.error(`Model loading failed: ${err.message}`),
      },
    );
  }

  return (
    <div className="space-y-4">
      {status?.loaded && (
        <p className="rounded-md border bg-blue-50 p-2 text-xs text-blue-900">
          Model already loaded from a previous session:{" "}
          {status.model_name ?? status.current_model?.name} on{" "}
          {status.current_model?.device}
        </p>
      )}

      <div className="space-y-1.5">
        <Label>Model</Label>
        <Select value={modelKey} onValueChange={(v) => setModelKey(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Please select model" />
          </SelectTrigger>
          <SelectContent>
            {modelsData &&
              Object.entries(modelsData.models).map(([key, m]) => (
                <SelectItem key={key} value={key}>
                  {m.name} ({m.params}) - {m.description}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          Which Kronos checkpoint to run predictions with
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Device</Label>
        <Select value={device} onValueChange={(v) => setDevice(v ?? "cpu")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cpu">CPU</SelectItem>
            <SelectItem value="cuda">CUDA (NVIDIA GPU)</SelectItem>
            <SelectItem value="mps">MPS (Apple Silicon)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        disabled={loadModel.isPending}
        onClick={handleLoad}
      >
        <RefreshCw className="size-4" />
        Load Model
      </Button>
    </div>
  );
}
