import React from 'react';
import { Sparkles, Image as ImageIcon, Video, Mic, Shield, Globe, DownloadCloud, ThumbsUp, Smartphone, Swords, Activity, CreditCard, Mail, MessageCircle, Phone, Folder } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  onNavigate: (tab: any) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const apps = [
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

  return (
    <div className="flex-1 overflow-y-auto p-6 pt-24 pb-32 relative z-10 custom-scrollbar">
      <div className="max-w-md mx-auto">
        {/* App Grid - iOS Style */}
        <div className="grid grid-cols-4 gap-x-4 gap-y-8 mt-8">
          {apps.map((app, idx) => (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => onNavigate(app.id)}
              className="flex flex-col items-center space-y-2 group"
            >
              <div className={`w-[68px] h-[68px] rounded-[1.4rem] ${app.bg} flex items-center justify-center shadow-lg border border-white/10 backdrop-blur-xl transition-transform duration-300 group-hover:scale-105 group-active:scale-95 relative overflow-hidden ios-shadow`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                <app.icon className={`w-8 h-8 ${app.color} drop-shadow-md`} />
              </div>
              <span className="text-[11px] font-medium text-white/90 truncate w-full text-center drop-shadow-md tracking-wide">{app.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
