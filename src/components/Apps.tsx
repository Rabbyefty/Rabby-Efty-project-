import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Video, Mic, Shield, Globe, DownloadCloud, ThumbsUp, Smartphone, Swords, Activity, CreditCard, Mail, MessageCircle, Phone, Folder, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppsProps {
  onNavigate: (tab: any) => void;
  isVpnConnected: boolean;
  setIsVpnConnected: (val: boolean) => void;
}

export function Apps({ onNavigate, isVpnConnected, setIsVpnConnected }: AppsProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const width = scrollContainerRef.current.clientWidth;
      const newPage = Math.round(scrollLeft / width);
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    }
  };

  const apps = [
    { id: 'build-apk', name: 'APK Builder', icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/20' },
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
    { id: 'temp-mail', name: 'Temp Mail', icon: Mail, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    { id: 'temp-number', name: 'Temp Number', icon: Phone, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500/20' },
    { id: 'file-manager', name: 'Files', icon: Folder, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { id: 'gallery', name: 'Photos', icon: ImageIcon, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  ];

  const filteredApps = apps.filter(app => app.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div 
      className="flex-1 overflow-y-auto p-6 pt-24 pb-32 relative z-10 custom-scrollbar h-full"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={(e, info) => {
        if (info.offset.y > 50 && !showSearch) {
          setShowSearch(true);
        } else if (info.offset.y < -50 && showSearch) {
          setShowSearch(false);
        }
      }}
    >
      <div className="max-w-md mx-auto relative">
        {/* Spotlight Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute -top-16 left-0 right-0 z-50"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search Apps"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 dark:bg-black/40 border border-white/20 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-xl"
                  onBlur={() => {
                    if (!searchQuery) setShowSearch(false);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <h2 className="text-2xl font-bold text-white mb-6 pl-2">App Library</h2>

        {/* App Grid - iOS Style Pagination */}
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-6 px-6 pb-8" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {Array.from({ length: Math.ceil(filteredApps.length / 16) }).map((_, pageIdx) => {
              const pageApps = filteredApps.slice(pageIdx * 16, (pageIdx + 1) * 16);
              return (
                <div key={pageIdx} className="min-w-full snap-center grid grid-cols-4 gap-x-3 gap-y-5 content-start">
                  {pageApps.map((app, idx) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                      className="relative flex flex-col items-center"
                    >
                      <button
                        onClick={() => onNavigate(app.id)}
                        className="flex flex-col items-center space-y-1 group w-full"
                      >
                        <div className={`w-[60px] h-[60px] rounded-[1.4rem] ${app.bg} flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2)] border ${app.id === 'vpn' ? (isVpnConnected ? 'border-green-400/50' : 'border-white/20') : 'border-white/20'} backdrop-blur-3xl transition-all duration-300 group-hover:scale-105 group-active:scale-95 relative overflow-hidden`}>
                          {/* Glossy top reflection */}
                          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                          {/* Diagonal light sweep */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/5 pointer-events-none" />
                          <app.icon className={`w-8 h-8 ${app.color} drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10`} strokeWidth={1.5} />
                        </div>
                        <span className="text-[11px] font-medium text-white/90 truncate w-full text-center drop-shadow-md tracking-wide">{app.name}</span>
                      </button>
                      {app.id === 'vpn' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsVpnConnected(!isVpnConnected);
                          }}
                          className={`absolute -top-1 -right-1 w-8 h-4 rounded-full p-0.5 transition-colors shadow-md z-10 ${isVpnConnected ? 'bg-green-500' : 'bg-gray-500'}`}
                        >
                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isVpnConnected ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
          
          {/* Page Dots */}
          {Math.ceil(filteredApps.length / 16) > 1 && (
            <div className="flex justify-center gap-2 absolute bottom-0 left-0 right-0">
              {Array.from({ length: Math.ceil(filteredApps.length / 16) }).map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentPage ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
