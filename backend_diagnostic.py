import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / "backend" / ".env"
load_dotenv(dotenv_path=env_path)

keys_to_check = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SMTP_EMAIL",
    "SMTP_PASSWORD",
    "LIVEKIT_URL",
    "LIVEKIT_API_KEY",
    "LIVEKIT_API_SECRET"
]

print("--- Environment Check ---")
for key in keys_to_check:
    val = os.getenv(key)
    if not val:
        print(f"❌ {key}: MISSING")
    elif "your_" in val or "insert_" in val or "placeholder" in val:
        print(f"⚠️ {key}: Still has PLACEHOLDER value")
    else:
        print(f"✅ {key}: Present ({val[:5]}...)")
