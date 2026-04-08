import os
import aiohttp
import logging
import json
from typing import Dict, Any, Optional
from supabase import create_client, Client

logger = logging.getLogger("personaplex-service")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

class PersonaplexService:
    def __init__(self):
        self.api_url = os.getenv("PERSONAPLEX_API_URL")
        self.api_key = os.getenv("PERSONAPLEX_API_KEY")

    def _get_headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def trigger_call(self, user_id: str, to_number: str, from_number: str, persona_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Triggers a call via Personaplex cloud API.
        """
        if not self.api_url or not self.api_key:
            return {"error": "Personaplex configuration missing"}

        endpoint = f"{self.api_url}/v1/calls/trigger"
        payload = {
            "to": to_number,
            "from_number": from_number,
            "persona_id": persona_id,
            "context": context,
            "webhook_url": f"{os.getenv('AIVANTS_API_URL')}/api/webhooks/personaplex"
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(endpoint, headers=self._get_headers(), json=payload) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        call_id = data.get("call_id")
                        
                        # Save initial call record to Supabase
                        if supabase:
                            try:
                                supabase.table("voice_calls").insert({
                                    "user_id": user_id,
                                    "call_id": call_id,
                                    "to_number": to_number,
                                    "from_number": from_number,
                                    "status": "triggered",
                                    "persona_id": persona_id
                                }).execute()
                            except Exception as db_err:
                                logger.error(f"Failed to save call record: {db_err}")
                        
                        return data
                    else:
                        text = await resp.text()
                        logger.error(f"Personaplex Trigger error: {resp.status} - {text}")
                        return {"error": text}
        except Exception as e:
            logger.error(f"Error triggering Personaplex call: {e}")
            return {"error": str(e)}

    async def sync_call_result(self, call_id: str, result_data: Dict[str, Any]):
        """
        Processes and saves call results from Personaplex webhook or polling.
        Expected result_data format:
        {
            "transcript": "...",
            "summary": "...",
            "interest_level": "High/Medium/Low",
            "key_points": ["...", "..."],
            "status": "completed/failed"
        }
        """
        if not supabase:
            logger.error("Supabase client not initialized")
            return

        try:
            # Update the call record in Supabase
            supabase.table("voice_calls").update({
                "status": result_data.get("status"),
                "transcript": result_data.get("transcript"),
                "summary": result_data.get("summary"),
                "interest_level": result_data.get("interest_level"),
                "key_points": json.dumps(result_data.get("key_points", [])),
                "completed_at": "now()"
            }).eq("call_id", call_id).execute()
            
            logger.info(f"Successfully synced call result for {call_id}")
        except Exception as e:
            logger.error(f"Error syncing call result: {e}")

# Singleton instance
personaplex_service = PersonaplexService()
