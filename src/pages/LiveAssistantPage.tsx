import { VoiceAssistant } from "@/components/agent/VoiceAssistant";
import { useNavigate } from "react-router-dom";
import { MicrophoneStage } from "@phosphor-icons/react";

export default function LiveAssistantPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-y-auto custom-scrollbar">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <MicrophoneStage weight="duotone" className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">Live Voice Assistant</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 transition-all animate-in fade-in duration-700">
        <div className="w-full max-w-4xl glass-effect rounded-3xl p-8 shadow-2xl border border-primary/20 bg-primary/5">
          <VoiceAssistant onClose={() => navigate("/dashboard")} />
        </div>
      </div>
    </div>
  );
}
