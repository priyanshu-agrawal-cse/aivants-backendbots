import { VoiceAssistant } from "@/components/agent/VoiceAssistant";
import { useNavigate } from "react-router-dom";

export default function VoiceAgentPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <VoiceAssistant onClose={() => navigate("/dashboard")} />
    </div>
  );
}
