"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const CHANNELS = [
  {
    id: "telegram",
    name: "Telegram",
    color: "#229ED9",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    color: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
  },
  {
    id: "voice",
    name: "Voice Call",
    color: "#6366f1",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
];

function ChatBubble({ text, isUser, delay }: { text: string; isUser: boolean; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed tracking-[-0.01em] ${
          isUser
            ? "bg-[#0a0a0a] text-white rounded-br-sm"
            : "bg-white border border-black/[0.07] text-[#0a0a0a] rounded-bl-sm"
        }`}
      >
        {text}
      </div>
    </motion.div>
  );
}

export default function CommandCenter() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeChannel, setActiveChannel] = useState("telegram");
  const [chatKey, setChatKey] = useState(0);

  function handleChannelSwitch(id: string) {
    setActiveChannel(id);
    setChatKey((k) => k + 1);
  }

  return (
    <section className="py-32 px-6 bg-[#f5f5f5]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#9a9a9a] uppercase mb-4">
            Command Center
          </p>
          <h2 className="text-[36px] sm:text-[44px] font-semibold tracking-[-0.03em] text-[#0a0a0a] leading-[1.1] mb-4">
            Operate from anywhere
          </h2>
          <p className="text-[15.5px] text-[#6a6a6a] max-w-md mx-auto">
            Send commands in plain language. AIVANTS authenticates, understands, and executes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Chat UI */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="rounded-3xl border border-black/[0.08] bg-white overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.06)]"
          >
            {/* Channel switcher */}
            <div className="flex gap-2 p-4 border-b border-black/[0.06]">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleChannelSwitch(ch.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                    activeChannel === ch.id
                      ? "bg-[#0a0a0a] text-white"
                      : "text-[#6a6a6a] hover:bg-black/5"
                  }`}
                >
                  {ch.icon}
                  {ch.name}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div key={chatKey} className="p-5 space-y-3 min-h-[220px] flex flex-col justify-end">
              <ChatBubble text="Follow up all leads from yesterday" isUser delay={300} />
              <ChatBubble text="Verifying identity… ✓ Secure code accepted." isUser={false} delay={900} />
              <ChatBubble text="Completed. 23 leads contacted across email and WhatsApp." isUser={false} delay={1600} />
            </div>

            {/* Input area */}
            <div className="px-5 pb-5">
              <div className="flex items-center gap-2.5 rounded-xl bg-[#f8f8f8] border border-black/[0.07] px-4 py-2.5">
                <span className="text-[12.5px] text-[#bbb] flex-1">Type a command…</span>
                <div className="w-6 h-6 rounded-full bg-[#0a0a0a] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="12" height="12">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security + info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="space-y-4"
          >
            {/* Security block */}
            <div className="rounded-2xl border border-black/[0.07] bg-white p-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0a0a0a] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="16" height="16">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0a0a0a] tracking-[-0.02em] mb-1.5">
                    Secure command authentication
                  </h3>
                  <p className="text-[13px] text-[#7a7a7a] leading-relaxed">
                    Each command requires authentication via a secure code, ensuring only authorized actions are executed. No action runs without your approval.
                  </p>
                </div>
              </div>
            </div>

            {/* Three modes */}
            {[
              { icon: "💬", label: "Telegram", desc: "Command your business from Telegram — the fastest way to stay in control." },
              { icon: "📱", label: "WhatsApp", desc: "Use WhatsApp like a command line. Natural language, instant execution." },
              { icon: "🎙️", label: "Voice Agent", desc: "Call in, speak your instructions. Your AI handles the rest." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white/60 p-4"
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-[#0a0a0a] tracking-[-0.01em]">{item.label}</p>
                  <p className="text-[12px] text-[#8a8a8a] mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
