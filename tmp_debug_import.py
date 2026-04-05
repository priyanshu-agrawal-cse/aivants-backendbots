import livekit.agents
import pkgutil
import traceback

print("LiveKit Agents Submodules:")
for loader, name, ispkg in pkgutil.walk_packages(livekit.agents.__path__, livekit.agents.__name__ + "."):
    print(f"- {name}")

print("\nTrying common imports:")
try:
    from livekit.agents.pipeline import VoicePipelineAgent
    print("SUCCESS: from livekit.agents.pipeline import VoicePipelineAgent")
except ImportError:
    print("FAILED: from livekit.agents.pipeline import VoicePipelineAgent")
    # traceback.print_exc()

try:
    from livekit.agents import pipeline
    print("SUCCESS: from livekit.agents import pipeline")
except ImportError:
    print("FAILED: from livekit.agents import pipeline")

try:
    from livekit.agents.multimodal import MultimodalAgent
    print("SUCCESS: from livekit.agents.multimodal import MultimodalAgent")
except ImportError:
    print("FAILED: from livekit.agents.multimodal import MultimodalAgent")

try:
    from livekit.agents.voice import VoiceAssistant
    print("SUCCESS: from livekit.agents.voice import VoiceAssistant")
except ImportError:
    print("FAILED: from livekit.agents.voice import VoiceAssistant")
