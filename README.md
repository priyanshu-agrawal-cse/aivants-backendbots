# Aivants - Advanced AI Backend & Bots

Aivants is a state-of-the-art business automation platform designed to leverage AI agents for CRM, multi-channel messaging, and outreach. This repository contains the full backend and frontend architecture for managing business workflows with intelligent voice and text agents.

## 🚀 Key Features

- **🧠 Multi-Agent Orchestration**: Intelligent agents for CRM management, mailing campaigns, and business summaries.
- **🎙️ Real-time AI Voice Agents**: Integrated with **LiveKit**, **OpenAI GPT-4o-mini**, and **ElevenLabs Flash V2** for highly responsive, human-like voice interaction.
- **📱 WhatsApp Automation**: Seamless communication through **whatsapp-web.js** for automated customer outreach.
- **📧 Intelligent Emailing**: Customizable SMTP configurations per client, supporting individual sends and mass campaigns.
- **🤝 Integrated CRM**: Built with **Supabase** to manage leads, campaigns, and business summaries efficiently.
- **🌐 Responsive UI**: Built with **React**, **Vite**, **Tailwind CSS**, and **Shadcn UI** for a premium dashboard experience.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS, Framer Motion, Lucide Icons
- **UI Components**: Radix UI, Shadcn UI
- **State Management**: React Query (TanStack)
- **Routing**: React Router DOM v6

### Backend
- **Node.js (Express)**: Handles proxy requests, mailing services, and core API logic.
- **Python (LiveKit Workers)**: Powering real-time AI voice agents using the LiveKit Agent SDK.
- **Database**: Supabase (PostgreSQL, Auth, Storage).
- **Messaging**: `whatsapp-web.js`, `nodemailer`.

### AI Models
- **LLM**: OpenAI GPT-4o-mini
- **STT**: LiveKit Inference / OpenAI Whisper
- **TTS**: ElevenLabs Flash V2
- **VAD**: Silero VAD

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- Supabase Project & API Keys
- LiveKit Server / Cloud Account
- OpenAI & ElevenLabs API Keys

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/priyanshu-agrawal-cse/aivants-backendbots.git
   cd aivants
   ```

2. **Install Dependencies**:
   ```bash
   # Frontend and Node.js backend
   npm install

   # Python dependencies (for AI workers)
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Environment Configuration**:
   Create a `.env` file in the root with the following keys (see `.env` for current configurations):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
   - `OPENAI_API_KEY`, `ELEVEN_LABS_API_KEY`
   - `AIVANTS_API_URL` (usually http://localhost:3001)

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   This will start both the Vite frontend and the Node.js backend proxy.

5. **Start the AI Voice Worker** (Optional):
   ```bash
   python backend/agent_worker.py dev
   ```

## 📄 License

(C) 2024 Aivants. All rights reserved.

---
Built with ❤️ by [Priyanshu Agrawal](https://github.com/priyanshu-agrawal-cse)
