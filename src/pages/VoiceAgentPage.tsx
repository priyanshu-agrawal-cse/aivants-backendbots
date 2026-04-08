import { VoiceDashboard } from "@/components/voice/VoiceDashboard";
import { ChartLineUp } from "@phosphor-icons/react";

export default function VoiceAgentPage() {
  return (
    <div className="flex flex-col h-full bg-background/50">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ChartLineUp weight="duotone" className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              AI Calling Agent Hub
            </h1>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 transition-all animate-in fade-in duration-700">
          <VoiceDashboard />
        </div>
      </div>
    </div>
  );
}
