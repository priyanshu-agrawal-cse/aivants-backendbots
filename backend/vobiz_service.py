import os
import aiohttp
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("vobiz-service")

class VobizService:
    def __init__(self):
        self.base_url = "https://api.vobiz.ai/api/v1"

    def _get_headers(self, auth_id: str, auth_token: str):
        return {
            "X-Auth-ID": auth_id,
            "X-Auth-Token": auth_token,
            "Content-Type": "application/json"
        }

    async def list_available_numbers(self, auth_id: str, auth_token: str, country_code: str = "US") -> List[Dict[str, Any]]:
        """
        Lists available phone numbers from Vobiz inventory using provided credentials.
        """
        if not auth_id or not auth_token:
            logger.error("Vobiz credentials missing for this request")
            return []

        url = f"{self.base_url}/account/{auth_id}/inventory/numbers"
        params = {"country": country_code}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self._get_headers(auth_id, auth_token), params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("numbers", [])
                    else:
                        text = await resp.text()
                        logger.error(f"Vobiz API error: {resp.status} - {text}")
                        return []
        except Exception as e:
            logger.error(f"Error listing Vobiz numbers: {e}")
            return []

    async def purchase_number(self, auth_id: str, auth_token: str, phone_number: str) -> Dict[str, Any]:
        """
        Purchases a specific phone number from the inventory using provided credentials.
        """
        if not auth_id or not auth_token:
            return {"error": "Vobiz credentials missing"}

        url = f"{self.base_url}/account/{auth_id}/numbers/purchase-from-inventory"
        payload = {"number": phone_number}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self._get_headers(auth_id, auth_token), json=payload) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        text = await resp.text()
                        logger.error(f"Vobiz Purchase error: {resp.status} - {text}")
                        return {"error": text}
        except Exception as e:
            logger.error(f"Error purchasing Vobiz number: {e}")
            return {"error": str(e)}

# Singleton instance
vobiz_service = VobizService()
