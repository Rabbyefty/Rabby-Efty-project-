import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Home } from './components/Home';
import { StatusBar } from './components/StatusBar';
import { UploadedFile, ChatMessage } from './types';
import { initChatSession, sendChatMessage, restoreChatHistory } from './services/gemini';
import { Menu, ChevronRight, Share, Battery, Wifi, Signal, Image as ImageIcon, Video, Mic, Sparkles, Shield, Globe, DownloadCloud, ThumbsUp, Smartphone, Home as HomeIcon, ArrowLeft, LogOut, User as UserIcon, Swords, Activity, Sun, Moon, CreditCard, Mail, Loader2, MessageCircle, Phone, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, logout, onAuthStateChanged, User } from './firebase';
import { populateDummyData } from './lib/populate';

const Chatbot = lazy(() => import('./components/Chatbot').then(m => ({ default: m.Chatbot })));
const ImageGenerator = lazy(() => import('./components/ImageGenerator').then(m => ({ default: m.ImageGenerator })));
const VideoGenerator = lazy(() => import('./components/VideoGenerator').then(m => ({ default: m.VideoGenerator })));
const VoiceChat = lazy(() => import('./components/VoiceChat').then(m => ({ default: m.VoiceChat })));
const Vpn = lazy(() => import('./components/Vpn').then(m => ({ default: m.Vpn })));
const Browser = lazy(() => import('./components/Browser').then(m => ({ default: m.Browser })));
const VideoDownloader = lazy(() => import('./components/VideoDownloader').then(m => ({ default: m.VideoDownloader })));
const FbAutoLike = lazy(() => import('./components/FbAutoLike').then(m => ({ default: m.FbAutoLike })));
const BuildApk = lazy(() => import('./components/BuildApk').then(m => ({ default: m.BuildApk })));
const ArenaAi = lazy(() => import('./components/ArenaAi').then(m => ({ default: m.ArenaAi })));
const CardGenerator = lazy(() => import('./components/CardGenerator').then(m => ({ default: m.CardGenerator })));
const TempMail = lazy(() => import('./components/TempMail').then(m => ({ default: m.TempMail })));
const TempNumber = lazy(() => import('./components/TempNumber').then(m => ({ default: m.TempNumber })));
const SystemStatus = lazy(() => import('./components/SystemStatus').then(m => ({ default: m.SystemStatus })));
const WhatsApp = lazy(() => import('./components/WhatsApp').then(m => ({ default: m.WhatsApp })));
const FileManager = lazy(() => import('./components/FileManager').then(m => ({ default: m.FileManager })));
const Gallery = lazy(() => import('./components/Gallery').then(m => ({ default: m.Gallery })));

type Tab = 'home' | 'image' | 'video' | 'voice' | 'vpn' | 'browser' | 'downloader' | 'fb-autolike' | 'build-apk' | 'arena-ai' | 'status' | 'card-gen' | 'temp-mail' | 'temp-number' | 'whatsapp' | 'file-manager' | 'gallery';

const APPS = [
  { id: 'image', name: 'Image', icon: ImageIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  { id: 'video', name: 'Video', icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 'voice', name: 'Voice', icon: Mic, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  { id: 'vpn', name: 'VPN', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { id: 'browser', name: 'Browser', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'downloader', name: 'Downloader', icon: DownloadCloud, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  { id: 'status', name: 'Status', icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  { id: 'card-gen', name: 'Card Gen', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { id: 'arena-ai', name: 'Arena AI', icon: Swords, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { id: 'fb-autolike', name: 'FB Liker', icon: ThumbsUp, color: 'text-blue-500', bg: 'bg-blue-600/20' },
  { id: 'build-apk', name: 'APK Builder', icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/20' },
  { id: 'temp-mail', name: 'Temp Mail', icon: Mail, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  { id: 'temp-number', name: 'Temp Number', icon: Phone, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500/20' },
  { id: 'file-manager', name: 'Files', icon: Folder, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'gallery', name: 'Photos', icon: ImageIcon, color: 'text-purple-400', bg: 'bg-purple-500/20' },
];

const DOCK_APPS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500/20' },
  { id: 'browser', name: 'Browser', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'arena-ai', name: 'Arena AI', icon: Swords, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { id: 'status', name: 'Settings', icon: Activity, color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [history, setHistory] = useState<Tab[]>(['home']);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const messages = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        restoreChatHistory(messages);
        return messages;
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isVpnConnected, setIsVpnConnected] = useState(false);

  const [isDynamicIslandExpanded, setIsDynamicIslandExpanded] = useState(false);
  const [dynamicIslandContent, setDynamicIslandContent] = useState<React.ReactNode>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  // Dynamic Island Auto-collapse
  useEffect(() => {
    if (isDynamicIslandExpanded) {
      const timer = setTimeout(() => setIsDynamicIslandExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isDynamicIslandExpanded]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    
    // Populate dummy data for File Manager and Gallery
    populateDummyData();
    
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user' && error?.message !== 'Firebase: Error (auth/popup-closed-by-user).') {
        console.error("Sign in failed:", error);
        alert("Sign in failed. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    localStorage.removeItem('chatHistory');
    initChatSession(files, null);
  };

  const handleFilesAdded = (newFiles: UploadedFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (text: string) => {
    const userMsgId = Date.now().toString();
    const userMsg: ChatMessage = { 
      id: userMsgId,
      role: 'user', 
      text,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await sendChatMessage(text);
      setChatMessages((prev) => {
        const updated = prev.map(msg => 
          msg.id === userMsgId ? { ...msg, status: 'read' as const } : msg
        );
        return [
          ...updated, 
          { 
            id: Date.now().toString(),
            role: 'model', 
            text: response.text,
            sources: response.sources,
            timestamp: new Date()
          }
        ];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages((prev) => {
        const updated = prev.map(msg => 
          msg.id === userMsgId ? { ...msg, status: 'read' as const } : msg
        );
        return [
          ...updated,
          { 
            id: Date.now().toString(),
            role: 'model', 
            text: 'Sorry, I encountered an error while processing your request.',
            timestamp: new Date()
          }
        ];
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleNavigate = (tab: Tab) => {
    setActiveTab(tab);
    setHistory(prev => [...prev, tab]);
  };

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current
      const previousTab = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setActiveTab(previousTab);
    }
  };

  return (
    <div 
      className={`flex flex-col h-screen w-full overflow-hidden font-sans relative bg-transparent transition-all duration-700 ${theme === 'light' ? 'light text-zinc-900' : 'text-white'} ${isVpnConnected ? 'shadow-[inset_0_0_100px_rgba(34,197,94,0.15)]' : ''}`}
    >
      {/* VPN Secure Overlay */}
      <AnimatePresence>
        {isVpnConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent animate-pulse" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Island */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto flex flex-col items-center">
        <motion.div 
          layout
          onClick={(e) => {
            // Prevent expanding if clicking the back button
            if ((e.target as HTMLElement).closest('.back-btn')) return;
            
            if (isDynamicIslandExpanded) {
              handleNavigate('status');
              setIsDynamicIslandExpanded(false);
            } else {
              setIsDynamicIslandExpanded(true);
            }
          }}
          className={`dynamic-island liquid-glass ${isDynamicIslandExpanded ? 'w-72 h-20' : (activeTab !== 'home' ? 'w-[140px]' : 'w-[126px]')} h-[36px] cursor-pointer ios-shadow relative`}
        >
          <AnimatePresence mode="wait">
            {!isDynamicIslandExpanded ? (
              <motion.div 
                key="pill"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2 w-full h-full justify-between px-4"
              >
                {activeTab !== 'home' ? (
                  <button 
                    onClick={handleBack}
                    className="back-btn flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-75 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="expanded"
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="w-full h-full flex items-center justify-between px-5"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">꧁Rᴀʙʙʏ Eғᴛʏ꧂</span>
                    <span className="text-sm font-bold text-white tracking-tight">System Active</span>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-2 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-[9px] font-black text-green-400 tracking-widest uppercase">Secure</span>
                  </div>
                  <span className="text-[9px] text-white/30 font-medium tracking-tighter">v17.0.1 PRO</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className={`mt-2 text-xs font-bold tracking-widest uppercase ${theme === 'light' ? 'text-zinc-400' : 'text-white/40'}`}
        >
          ꧁Rᴀʙʙʏ Eғᴛʏ꧂
        </motion.div>
      </div>

      {/* iOS Status Bar */}
      <StatusBar theme={theme} isVpnConnected={isVpnConnected} />

      {/* Top Navigation Bar - Removed for iOS look */}
      
      {/* Sidebar - Removed for iOS look */}

      {/* Main Content */}
      <div className={`flex flex-1 overflow-hidden relative z-10 ${activeTab !== 'home' ? 'pt-12 pb-[100px]' : ''}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="h-full w-full"
            >
              <Home onNavigate={handleNavigate} />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="h-full w-full bg-black/40 backdrop-blur-xl rounded-t-[2.5rem] border-t border-white/10 overflow-hidden flex flex-col"
            >
              <div className="flex-1 overflow-y-auto relative">
                <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-white/50" /></div>}>
                  {activeTab === 'image' && <ImageGenerator isVpnConnected={isVpnConnected} />}
                  {activeTab === 'video' && <VideoGenerator isVpnConnected={isVpnConnected} />}
                  {activeTab === 'voice' && <VoiceChat isVpnConnected={isVpnConnected} />}
                  {activeTab === 'vpn' && <Vpn isConnected={isVpnConnected} setIsConnected={setIsVpnConnected} />}
                  {activeTab === 'browser' && <Browser isVpnConnected={isVpnConnected} setIsVpnConnected={setIsVpnConnected} />}
                  {activeTab === 'downloader' && <VideoDownloader isVpnConnected={isVpnConnected} />}
                  {activeTab === 'fb-autolike' && <FbAutoLike isVpnConnected={isVpnConnected} />}
                  {activeTab === 'build-apk' && <BuildApk isVpnConnected={isVpnConnected} />}
                  {activeTab === 'arena-ai' && <ArenaAi isVpnConnected={isVpnConnected} />}
                  {activeTab === 'card-gen' && <CardGenerator isVpnConnected={isVpnConnected} />}
                  {activeTab === 'temp-mail' && <TempMail isVpnConnected={isVpnConnected} />}
                  {activeTab === 'temp-number' && <TempNumber isVpnConnected={isVpnConnected} />}
                  {activeTab === 'whatsapp' && <WhatsApp />}
                  {activeTab === 'file-manager' && <FileManager />}
                  {activeTab === 'gallery' && <Gallery />}
                  {activeTab === 'status' && <SystemStatus 
                    isVpnConnected={isVpnConnected} 
                    theme={theme}
                    setTheme={setTheme}
                    user={user}
                    isAuthLoading={isAuthLoading}
                    handleSignIn={handleSignIn}
                    handleLogout={handleLogout}
                  />}
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chatbot (hidden in voice tab and home) */}
      {activeTab !== 'voice' && activeTab !== 'home' && (
        <Suspense fallback={null}>
          <Chatbot
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            isTyping={isTyping}
          />
        </Suspense>
      )}

      {/* Bottom Navigation Bar - iOS Pro Dock Style */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-md mx-auto glass-dock liquid-glass p-2 flex flex-col items-center pointer-events-auto ios-shadow rounded-t-[2.5rem] border-b-0">
          <div className="flex items-center justify-around w-full">
            <button 
              onClick={() => handleNavigate('home')}
              className={`p-4 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'home' ? (theme === 'light' ? 'bg-black/10 text-zinc-900 scale-110 shadow-lg' : 'bg-white/20 text-white scale-110 shadow-lg') : (theme === 'light' ? 'text-zinc-500 hover:text-zinc-800 hover:bg-black/5' : 'text-white/40 hover:text-white/70 hover:bg-white/5')}`}
            >
              <HomeIcon className="w-7 h-7" />
            </button>
            <button 
              onClick={() => handleNavigate('image')}
              className={`p-4 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'image' ? (theme === 'light' ? 'bg-black/10 text-zinc-900 scale-110 shadow-lg' : 'bg-white/20 text-white scale-110 shadow-lg') : (theme === 'light' ? 'text-zinc-500 hover:text-zinc-800 hover:bg-black/5' : 'text-white/40 hover:text-white/70 hover:bg-white/5')}`}
            >
              <ImageIcon className="w-7 h-7" />
            </button>
            <button 
              onClick={() => handleNavigate('video')}
              className={`p-4 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'video' ? (theme === 'light' ? 'bg-black/10 text-zinc-900 scale-110 shadow-lg' : 'bg-white/20 text-white scale-110 shadow-lg') : (theme === 'light' ? 'text-zinc-500 hover:text-zinc-800 hover:bg-black/5' : 'text-white/40 hover:text-white/70 hover:bg-white/5')}`}
            >
              <Video className="w-7 h-7" />
            </button>
            <button 
              onClick={() => handleNavigate('voice')}
              className={`p-4 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'voice' ? (theme === 'light' ? 'bg-black/10 text-zinc-900 scale-110 shadow-lg' : 'bg-white/20 text-white scale-110 shadow-lg') : (theme === 'light' ? 'text-zinc-500 hover:text-zinc-800 hover:bg-black/5' : 'text-white/40 hover:text-white/70 hover:bg-white/5')}`}
            >
              <Mic className="w-7 h-7" />
            </button>
            <button 
              onClick={() => handleNavigate('status')}
              className={`p-4 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'status' ? (theme === 'light' ? 'bg-black/10 text-zinc-900 scale-110 shadow-lg' : 'bg-white/20 text-white scale-110 shadow-lg') : (theme === 'light' ? 'text-zinc-500 hover:text-zinc-800 hover:bg-black/5' : 'text-white/40 hover:text-white/70 hover:bg-white/5')}`}
            >
              <Activity className="w-7 h-7" />
            </button>
          </div>
          
          {/* Home Indicator */}
          <div className={`w-36 h-1.5 rounded-full mt-3 mb-1 ${theme === 'light' ? 'bg-zinc-800/30' : 'bg-white/20'}`} />
        </div>
      </div>
    </div>
  );
}
