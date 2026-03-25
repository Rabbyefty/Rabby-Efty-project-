import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, MessageSquare, Check, CheckCheck, Trash2, Volume2, StopCircle, Zap, VolumeX } from 'lucide-react';
import { ChatMessage } from '@/src/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface ChatbotProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat?: () => void;
  isTyping: boolean;
}

export function Chatbot({ messages, onSendMessage, onClearChat, isTyping }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevIsTyping = useRef(isTyping);

  useEffect(() => {
    if (prevIsTyping.current && !isTyping && autoSpeak && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'model') {
        speakText(lastMsg.text, lastMsg.id);
      }
    }
    prevIsTyping.current = isTyping;
  }, [isTyping, messages, autoSpeak]);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speakText = (text: string, id: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(id);
      utterance.onend = () => setIsSpeaking(null);
      utterance.onerror = () => setIsSpeaking(null);
      
      const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || 
                             voices.find(v => v.lang.startsWith('en'));
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const [isRefining, setIsRefining] = useState(false);

  const refinePrompt = async () => {
    if (!input.trim()) return;
    setIsRefining(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key missing');
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Improve this chat prompt to be more clear, detailed, and effective for an AI assistant. Keep it concise but descriptive. Prompt: "${input}"`,
      });
      if (response.text) {
        setInput(response.text.trim());
      }
    } catch (err) {
      console.error('Failed to refine prompt:', err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-40 right-4 w-14 h-14 bg-indigo-500/90 backdrop-blur-xl text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-600 transition-all z-[90] border border-white/20 active:scale-95 liquid-glass"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-40 right-4 w-[calc(100vw-2rem)] sm:w-96 h-[600px] max-h-[calc(100vh-20rem)] z-[90] flex flex-col shadow-2xl rounded-[2.5rem] overflow-hidden glass-panel border border-white/10 liquid-glass"
          >
            <div className="flex items-center justify-between p-5 bg-black/40 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-white">꧁Rᴀʙʙʏ Eғᴛʏ꧂</h3>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setAutoSpeak(!autoSpeak);
                    if (autoSpeak) window.speechSynthesis.cancel();
                  }}
                  className={`p-2 rounded-full transition-colors ${autoSpeak ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                  title={autoSpeak ? "Disable Auto-Voice" : "Enable Auto-Voice"}
                >
                  {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                {onClearChat && messages.length > 0 && (
                  <button
                    onClick={onClearChat}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-red-400"
                    title="Clear Chat History"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-black/20">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-white/50">
                  <Bot className="w-12 h-12 text-white/20" />
                  <p className="text-sm max-w-[200px]">
                    Ask me anything about the generated images or videos.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isFirstInGroup = idx === 0 || messages[idx - 1].role !== msg.role;
                  const isLastInGroup = idx === messages.length - 1 || messages[idx + 1].role !== msg.role;

                  return (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className={`flex ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      } ${!isFirstInGroup ? 'mt-1' : 'mt-4'}`}
                    >
                      <div
                        className={`max-w-[85%] px-5 py-3.5 shadow-sm backdrop-blur-md ${
                          msg.role === 'user'
                            ? `bg-indigo-500/80 text-white border border-indigo-400/30 ${
                                isFirstInGroup && isLastInGroup ? 'rounded-3xl rounded-tr-sm' :
                                isFirstInGroup ? 'rounded-3xl rounded-tr-sm rounded-br-md' :
                                isLastInGroup ? 'rounded-3xl rounded-tr-md rounded-br-3xl' :
                                'rounded-3xl rounded-tr-md rounded-br-md'
                              }`
                            : `glass-card text-white/90 border border-white/10 ${
                                isFirstInGroup && isLastInGroup ? 'rounded-3xl rounded-tl-sm' :
                                isFirstInGroup ? 'rounded-3xl rounded-tl-sm rounded-bl-md' :
                                isLastInGroup ? 'rounded-3xl rounded-tl-md rounded-bl-3xl' :
                                'rounded-3xl rounded-tl-md rounded-bl-md'
                              }`
                        }`}
                      >
                        {isFirstInGroup && (
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              {msg.role === 'user' ? (
                                <User className="w-3 h-3 opacity-70" />
                              ) : (
                                <Bot className="w-3 h-3 text-indigo-400" />
                              )}
                              <span className="text-xs font-medium opacity-70">
                                {msg.role === 'user' ? 'You' : 'Assistant'}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="text-sm prose prose-sm max-w-none prose-invert relative group">
                          <Markdown>{msg.text}</Markdown>
                          
                          {msg.role === 'model' && (
                            <button
                              onClick={() => isSpeaking === msg.id ? window.speechSynthesis.cancel() : speakText(msg.text, msg.id)}
                              className={`absolute -right-2 -top-2 p-1.5 rounded-full bg-zinc-800 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-700 shadow-lg z-10`}
                              title={isSpeaking === msg.id ? "Stop speaking" : "Speak response"}
                            >
                              {isSpeaking === msg.id ? (
                                <StopCircle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                            </button>
                          )}
                        </div>
                        
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">Sources</p>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((source, i) => (
                                <a 
                                  key={i} 
                                  href={source.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70 transition-colors truncate max-w-[200px]"
                                  title={source.title}
                                >
                                  {source.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {isLastInGroup && (
                          <div className={`flex items-center justify-end space-x-1 mt-1.5 ${msg.role === 'user' ? 'text-indigo-100' : 'text-zinc-400'}`}>
                            {msg.timestamp && (
                              <span className="text-[10px]">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {msg.role === 'user' && msg.status && (
                              <span>
                                {msg.status === 'sent' ? (
                                  <Check className="w-3 h-3" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <CheckCheck className="w-3 h-3 text-blue-300" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="glass-card rounded-3xl rounded-tl-sm px-5 py-3.5 shadow-sm flex items-center space-x-2 border border-white/10">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span className="text-sm text-white/70">Thinking...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/10">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask ꧁Rᴀʙʙʏ Eғᴛʏ꧂..."
                  disabled={isTyping || isRefining}
                  className="flex-1 glass-input rounded-full px-4 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 border-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={refinePrompt}
                  disabled={!input.trim() || isTyping || isRefining}
                  className={`rounded-full shadow-sm bg-white/5 hover:bg-white/10 text-amber-400 border-none transition-all ${isRefining ? 'animate-pulse' : ''}`}
                  title="Enhance Prompt"
                >
                  {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                </Button>
                <Button type="submit" size="icon" disabled={!input.trim() || isTyping || isRefining} className="rounded-full shadow-sm bg-indigo-500 hover:bg-indigo-600 text-white border-none">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
