import { Loader2 } from "lucide-react";
import { useLLM } from "../hooks/useLLM";

export function StatusBar() {
  const { status, tps, isGenerating } = useLLM();

  if (status.state === "loading") {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-[#0A323580]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F0529C]" />
        <p className="text-sm">{status.message ?? "Loading model…"}</p>
        {status.progress != null && (
          <div className="w-64 h-2 bg-[#0A32351a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F0529C]"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  if (status.state === "error") {
    return (
      <div className="py-12 text-center text-sm text-red-600">
        Error loading model: {status.error}
      </div>
    );
  }

  if (isGenerating && tps > 0) {
    return (
      <div className="text-center text-xs text-[#0A323580] py-1">
        {tps} tokens/s
      </div>
    );
  }

  return null;
}
