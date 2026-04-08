import React, { useState, useCallback, useMemo } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useVoiceAssistant,
  BarVisualizer,
  TrackReference,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, PhoneOff, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface VoiceAssistantProps {
  onClose?: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedOption, setSelectedOption] = useState<'default' | 'company' | 'custom'>('default');
  const [customKey, setCustomKey] = useState("");

  const startConnection = useCallback(async () => {
    if (!user) {
      setError("You must be logged in to use the voice assistant.");
      return;
    }
    if (selectedOption === 'custom' && !customKey.trim()) {
      setError("Please enter your OpenAI API Key.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      let query = `/api/token?userId=${user.id}&participantName=${encodeURIComponent(user.email || 'user')}`;
      query += `&voiceMode=${selectedOption}`;
      if (selectedOption === 'custom') {
        query += `&openaiKey=${encodeURIComponent(customKey)}`;
      }
      
      const response = await fetch(query);
      if (!response.ok) throw new Error('Failed to get token');
      const data = await response.json();
      setToken(data.token);
      setUrl(data.url);
    } catch (err: any) {
      setError(err.message);
      setIsConnecting(false);
    }
  }, [user, selectedOption, customKey]);

  if (!token || !url) {
    return (
      <Card className="max-w-md mx-auto mt-10 shadow-2xl bg-background/80 backdrop-blur-lg border-primary/20">
        <CardHeader>
          <CardTitle className="text-center flex flex-col items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <MessageSquare className="w-12 h-12 text-primary animate-pulse" />
            </div>
            AI Voice Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center">
            Connect to our AI assistant to help you with your tasks using natural language.
          </p>

          <div className="space-y-4">
            <div className="space-y-3">
              <label 
                className={`flex gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${selectedOption === 'default' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                onClick={() => setSelectedOption('default')}
              >
                <input type="radio" checked={selectedOption === 'default'} onChange={() => setSelectedOption('default')} className="mt-1" />
                <div>
                  <div className="font-medium text-sm">Default Mode</div>
                  <div className="text-xs text-muted-foreground">Run completely on default voice infrastructure like it is running now.</div>
                </div>
              </label>

              <label 
                className={`flex gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${selectedOption === 'company' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                onClick={() => setSelectedOption('company')}
              >
                <input type="radio" checked={selectedOption === 'company'} onChange={() => setSelectedOption('company')} className="mt-1" />
                <div>
                  <div className="font-medium text-sm">Company Aivants Key</div>
                  <div className="text-xs text-muted-foreground">Use the pre-configured Aivants company OpenAI key.</div>
                </div>
              </label>

              <label 
                className={`flex gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${selectedOption === 'custom' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                onClick={() => setSelectedOption('custom')}
              >
                <input type="radio" checked={selectedOption === 'custom'} onChange={() => setSelectedOption('custom')} className="mt-1" />
                <div className="w-full">
                  <div className="font-medium text-sm">Custom API Key</div>
                  <div className="text-xs text-muted-foreground mb-2">Enter your own OpenAI API key to power the agent.</div>
                  {selectedOption === 'custom' && (
                    <input 
                      type="password"
                      placeholder="sk-..."
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          <Button 
            onClick={startConnection} 
            disabled={isConnecting}
            className="w-full py-6 text-lg font-semibold rounded-xl"
          >
            {isConnecting ? 'Connecting...' : 'Start Voice Chat'}
          </Button>
          {error && <p className="text-destructive text-sm text-center mt-2">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={url}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={() => {
        setToken(null);
        setIsConnecting(false);
        if (onClose) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
    >
      <RoomContent onClose={() => setToken(null)} />
    </LiveKitRoom>
  );
};

const RoomContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { state, audioTrack } = useVoiceAssistant();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative w-full max-w-2xl bg-background rounded-3xl overflow-hidden shadow-2xl border border-primary/20 aspect-video md:aspect-auto md:h-[600px] flex flex-col"
    >
      <div className="p-6 flex justify-between items-center border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${state === 'speaking' ? 'bg-green-500 animate-ping' : 'bg-primary'}`} />
          <h2 className="font-semibold text-xl">AI Assistant</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-8 overflow-y-auto">
        <div className="relative flex items-center justify-center w-64 h-64">
          <AnimatePresence>
            {state === 'speaking' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.3, scale: 1.5 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary rounded-full blur-3xl"
              />
            )}
          </AnimatePresence>
          <div className="relative z-10 w-full h-full flex items-center justify-center">
             {audioTrack ? (
               <BarVisualizer 
                 trackRef={audioTrack} 
                 className="w-full h-48 text-primary" 
                 barCount={32}
               />
             ) : (
               <div className="w-32 h-32 rounded-full bg-muted border-4 border-dashed border-primary/30 flex items-center justify-center">
                  <Mic className="w-16 h-16 text-muted-foreground" />
               </div>
             )}
          </div>
        </div>

        <div className="text-center space-y-2">
           <h3 className="text-2xl font-bold tracking-tight">
             {state === 'speaking' ? "The AI is speaking..." : state === 'listening' ? "I'm listening..." : "Connecting..."}
           </h3>
           <p className="text-muted-foreground text-sm max-w-sm mx-auto">
             You can ask me to help with email settings, campaigns, or any other part of Aivants.
           </p>
        </div>
      </div>

      <div className="p-8 border-t bg-muted/30">
        <VoiceAssistantControlBar className="flex justify-center gap-4 bg-transparent border-none shadow-none" />
      </div>

      <RoomAudioRenderer />
    </motion.div>
  );
};
