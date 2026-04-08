import os
import uuid
import asyncio
from fastapi import FastAPI, Depends, HTTPException, Header, BackgroundTasks, WebSocket
from pydantic import BaseModel
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NVIDIA PersonaPlex API Wrapper")

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
model_id = "nvidia/personaplex-7b-v1"
tokenizer = AutoTokenizer.from_pretrained(model_id, token=os.getenv("HF_TOKEN"))
model = AutoModelForCausalLM.from_pretrained(model_id, torch_dtype=torch.float16, device_map="auto", token=os.getenv("HF_TOKEN"))

class CallContext(BaseModel):
    purpose: str
    body: str

class TriggerCallRequest(BaseModel):
    to: str
    from_number: str = None
    persona_id: str
    context: CallContext
    webhook_url: str

class VobizWebhookData(BaseModel):
    call_id: str
    to: str
    from_number: str
    status: str
    custom_data: Optional[Dict[str, Any]] = None

API_KEY = os.environ.get("PERSONAPLEX_API_KEY", "dev-key-123")

def verify_api_key(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ")[1]
    if token != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return token

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "PersonaPlex Wrapper is running"}

# ---------------------------------------------------------
# DIRECT TRIGGER ENDPOINT (Without Vobiz Originating)
# ---------------------------------------------------------
@app.post("/v1/calls/trigger")
async def trigger_call(req: TriggerCallRequest, background_tasks: BackgroundTasks, token: str = Depends(verify_api_key)):
    call_id = f"plex_{uuid.uuid4().hex}"
    print(f"[TRIGGER] Call mapped. ID: {call_id} to {req.to} using Persona: {req.persona_id}")
    
    # In production with GPU, start the audio stream handling thread here
    background_tasks.add_task(simulate_call_completion, call_id, req.webhook_url, req.context.body)
    
    return {"call_id": call_id, "status": "queued"}

# ---------------------------------------------------------
# VOBIZ INTEGRATION ENDPOINTS
# ---------------------------------------------------------
@app.post("/v1/vobiz/webhook")
async def vobiz_webhook(data: VobizWebhookData, background_tasks: BackgroundTasks):
    """
    Endpoint for Vobiz to hit when a call connects. 
    Vobiz will pass the custom_data from Aivants containing persona and context.
    """
    call_id = data.call_id
    print(f"[VOBIZ WEBHOOK] Call started. ID: {call_id} to {data.to}")
    
    custom_data = data.custom_data or {}
    aivants_webhook = custom_data.get("aivants_webhook_url")
    context_body = custom_data.get("context", "General discussion")
    
    if aivants_webhook:
        background_tasks.add_task(simulate_call_completion, call_id, aivants_webhook, context_body)
        
    return {"status": "connected", "instructions": "stream_audio", "websocket_url": f"wss://{os.environ.get('DOMAIN', 'localhost:8000')}/v1/ws/voice"}

@app.websocket("/v1/ws/voice")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio streaming from Vobiz.
    This is where the NVIDIA PersonaPlex tensor logic would live.
    """
    await websocket.accept()
    print("[WEBSOCKET] Connected to Vobiz audio stream.")
    try:
        while True:
            # Receive audio chunk from Vobiz
            data = await websocket.receive_text()
            
            # TODO: Convert data to tensor
            # TODO: Run inference: model.generate(...)
            # TODO: Send tensor back as audio chunk
            
            await websocket.send_text("Audio chunk processed")
    except Exception as e:
        print(f"[WEBSOCKET] Disconnected: {e}")

async def simulate_call_completion(call_id: str, webhook_url: str, context_body: str):
    """
    Simulates the call processing for testing contexts without a GPU.
    """
    import httpx
    await asyncio.sleep(5) # Simulate call duration
    
    payload = {
        "call_id": call_id,
        "status": "completed",
        "transcript": f"User: Hello?\nAI: Hi! I'm calling about the following:\n{context_body}\nUser: Sounds great. I'm interested.\nAI: Thank you. Have a good day.",
        "summary": "The AI successfully conversed with the user about the context provided. The user expressed interest.",
        "interest_level": "High",
        "key_points": ["Answered phone", "Heard pitch", "Expressed high interest"]
    }
    
    print(f"[SIMULATE] Sending webhook result to {webhook_url}")
    try:
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json=payload)
            print("[SIMULATE] Webhook delivered.")
    except Exception as e:
        print(f"[SIMULATE] Webhook failed: {e}")
