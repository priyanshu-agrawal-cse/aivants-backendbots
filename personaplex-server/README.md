# NVIDIA PersonaPlex Cloud Wrapper

This directory contains a FastAPI wrapper designed to host the open-source **NVIDIA PersonaPlex** voice AI model and expose it to the Aivants backend over Vobiz telephony integrations.

## Architecture

1. **Aivants** triggers a call by hitting the Vobiz Cloud API.
2. Vobiz dials the user's phone number.
3. Upon connection, Vobiz makes a Webhook/WebSocket connection to **this PersonaPlex Server**.
4. This server processes the real-time audio streams.

## Deployment Instructions

To successfully integrate this with Aivants, you need to deploy this folder to a cloud provider so it is available on the public internet.

### Option 1: RunPod / GPU Cloud (Recommended for real Speech-to-Speech)
The actual NVIDIA PersonaPlex 7B model requires an NVIDIA GPU (e.g. A10G, A100).
1. Create a RunPod or Vast.ai account.
2. Launch a Pod using the standard PyTorch Docker template.
3. Once SSH'd in, copy this folder inside.
4. Run:
   ```bash
   pip install -r requirements.txt
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```
5. Note you will need to uncomment the HuggingFace model loading lines in `app.py` and write the WebSocket stream inferencing logic for full production use.

### Option 2: Render / Heroku / AWS Elastic Beanstalk (For Mock / Testing)
If you just want everything to "start working" in Aivants, this server is currently hardcoded in a "simulation mode". It will accept the Vobiz webhook and automatically dispatch a "mock" successful AI conversation transcript back to your Aivants database.
1. Create a free account on [Render.com](https://render.com).
2. Connect your GitHub repository and select this `personaplex-server` folder.
3. Deploy it as a "Web Service" using Docker.
4. In the Render Environment Variables, set:
   - `PERSONAPLEX_API_KEY`: Create a random, secure password (e.g., `my-super-secret-key-123`)
   - `DOMAIN`: The URL render gives you (e.g., `my-personaplex.onrender.com`)

## Connecting to Aivants

Once your server is deployed, go back to your **Supabase Dashboard** -> **Edge Functions** -> **Secrets** and add/update:

1. `PERSONAPLEX_API_URL` = `https://your-deployed-url.com` (from Render or RunPod)
2. `PERSONAPLEX_API_KEY` = The secret key you created above.
3. `VOBIZ_AUTH_ID` = Your Vobiz Account ID
4. `VOBIZ_AUTH_TOKEN` = Your Vobiz Auth Token

With these saved, Aivants campaigns and follow-ups will now correctly originate calls via Vobiz!
