import asyncio
import logging
import os
from pathlib import Path
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli, inference
from livekit.plugins import silero, openai
from dotenv import load_dotenv

import aiohttp
from supabase import create_client, Client
from livekit.agents import llm

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

# Supabase configuration
def get_env_secret(key, default=None):
    val = os.getenv(key)
    if not val or "insert_" in val or "your_" in val or "placeholder" in val:
        return default
    return val

SUPABASE_URL = get_env_secret("SUPABASE_URL")
SUPABASE_KEY = get_env_secret("SUPABASE_SERVICE_ROLE_KEY") or get_env_secret("VITE_SUPABASE_PUBLISHABLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

import json

API_BASE_URL = os.environ.get("AIVANTS_API_URL", "http://localhost:3001")

class AssistantFunctions:
    def __init__(self, user_id: str):
        self.user_id = user_id

    @llm.function_tool
    async def send_email(self, to: str, subject: str, body: str):
        """
        Sends an email using the user's specific SMTP settings from the backend proxy.
        """
        try:
            logger.info(f"Attempting to send email for user {self.user_id} to {to}")
            
            # Initial defaults (now strictly fallback if proxy fails completely)
            smtp_email = None
            smtp_password = None
            from_name = "Aivants Assistant"
            
            async with aiohttp.ClientSession() as session:
                proxy_payload = {"userId": self.user_id, "key": "smtp_config"}
                async with session.post(f"{API_BASE_URL}/api/proxy/get-memory", json=proxy_payload) as m_resp:
                    if m_resp.status == 200:
                        m_data = await m_resp.json()
                        if m_data.get("value"):
                            try:
                                config = json.loads(m_data["value"])
                                smtp_email = config.get("from_email")
                                smtp_password = config.get("smtp_password")
                                from_name = config.get("from_name", from_name)
                                logger.info(f"Using client-specific SMTP config via proxy")
                            except Exception as e:
                                logger.error(f"Failed to parse smtp_config from proxy: {e}")

                if not smtp_email or not smtp_password:
                    return (
                        "Error: SMTP credentials not found. Please configure your email settings "
                        "in the Dashboard (Settings -> Email & Messaging) before sending emails."
                    )

                # 2. Dispatch email via Node.js server
                payload = {
                    "smtp_email": smtp_email,
                    "smtp_password": smtp_password,
                    "from_name": from_name,
                    "to": to,
                    "subject": subject,
                    "body": body
                }
                async with session.post(f"{API_BASE_URL}/api/send-email", json=payload) as resp:
                    result = await resp.text()
                    if resp.status == 200:
                        return f"Email sent successfully to {to}"
                    else:
                        logger.error(f"Email server error: {result}")
                        return f"Failed to send email: {result}"
        except Exception as e:
            logger.error(f"Error in send_email tool: {e}")
            return f"Error sending email: {str(e)}"

    @llm.function_tool
    async def start_campaign(self, name: str, subject: str, body: str):
        """
        Creates a new email campaign for the user via the backend proxy.
        """
        try:
            logger.info(f"Creating campaign '{name}' for user {self.user_id}")
            payload = {
                "userId": self.user_id,
                "name": name,
                "subject": subject,
                "body": body
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{API_BASE_URL}/api/proxy/create-campaign", json=payload) as resp:
                    result = await resp.json()
                    if resp.status == 200:
                        return f"Campaign '{name}' created successfully!"
                    else:
                        raise Exception(result.get("error", "Proxy error"))
        except Exception as e:
            logger.error(f"Error in start_campaign tool: {e}")
            return f"Error starting campaign: {str(e)}"

    @llm.function_tool
    async def get_business_summary(self):
        """
        Retrieves a summary of leads and campaigns for the user.
        """
        try:
            logger.info(f"Fetching summary for user {self.user_id}")
            # For simplicity, we'll keep business summary as a direct read if it works, 
            # or move to proxy if it fails. Let's move to proxy for robustness.
            payload = {"userId": self.user_id}
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{API_BASE_URL}/api/proxy/get-summary", json=payload) as resp:
                    result = await resp.json()
                    if resp.status == 200:
                        return f"Business Summary: You have {result['leads']} leads and {result['campaigns']} campaigns."
                    else:
                        raise Exception(result.get("error", "Proxy error"))
        except Exception as e:
            logger.error(f"Error in get_business_summary: {e}")
            return f"Error fetching summary: {str(e)}"

class AivantsAssistant(Agent):
    def __init__(self, user_id: str) -> None:
        funcs = AssistantFunctions(user_id)
        super().__init__(
            instructions=(
                "You are the Aivants Business Assistant. Aivants is a platform for CRM, mailing, and business automation. "
                "You can help the user by: "
                "1. Sending individual emails. "
                "2. Starting outreach campaigns (creating new campaigns in the system). "
                "3. Providing a business summary (leads, campaigns). "
                "Be professional, encouraging, and task-oriented."
            ),
            tools=[funcs.send_email, funcs.start_campaign, funcs.get_business_summary]
        )


async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room {ctx.room.name}")
    await ctx.connect()
    
    # Wait for the user to be present and have metadata
    user_id = "00000000-0000-0000-0000-000000000000"
    voice_mode = "default"
    custom_openai_key = ""
    
    logger.info(f"Connected. Participants in room: {[p.identity for p in ctx.room.remote_participants.values()]}")
    
    for p in ctx.room.remote_participants.values():
        logger.info(f"Participant {p.identity} metadata: {p.metadata}")
        if p.metadata:
            try:
                meta = json.loads(p.metadata)
                if "userId" in meta:
                    user_id = meta["userId"]
                    logger.info(f"SUCCESS: Detected User ID from metadata: {user_id}")
                if "voiceMode" in meta:
                    voice_mode = meta["voiceMode"]
                if "openaiKey" in meta:
                    custom_openai_key = meta["openaiKey"]
                if "userId" in meta:
                    break
            except Exception as e:
                logger.error(f"Failed to parse metadata for {p.identity}: {e}")

    # Configure LLM based on user option
    llm_instance = None
    if voice_mode == "company":
        company_key = os.getenv("AIVANTS_OPENAI_API_KEY")
        if not company_key:
            logger.warning("AIVANTS_OPENAI_API_KEY not found in env, falling back to default OPENAI_API_KEY")
            llm_instance = inference.LLM(model="openai/gpt-4o-mini")
        else:
            logger.info("Using Company Aivants OpenAI API Key")
            llm_instance = openai.LLM(model="gpt-4o-mini", api_key=company_key)
    elif voice_mode == "custom" and custom_openai_key:
        logger.info("Using Custom User-provided OpenAI API Key")
        llm_instance = openai.LLM(model="gpt-4o-mini", api_key=custom_openai_key)
    else:
        logger.info("Using Default livekit inference LLM (OPENAI_API_KEY from env)")
        llm_instance = inference.LLM(model="openai/gpt-4o-mini")

    session = AgentSession(
        stt=inference.STT(),
        llm=llm_instance,
        tts=inference.TTS(model="elevenlabs/eleven_flash_v2"),
        vad=silero.VAD.load()
    )

    await session.start(
        room=ctx.room,
        agent=AivantsAssistant(user_id=user_id),
    )
    logger.info("Agent session started")

    logger.info("First greeting generated")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
