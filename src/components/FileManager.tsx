import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, File as FileIcon, Image as ImageIcon, Music, Video, 
  MoreHorizontal, Plus, Search, ChevronLeft, Trash2, Edit2, X, Download, Play, Pause,
  LayoutGrid, List
} from 'lucide-react';
import { VFSNode, getNodesByParent, addNode, deleteNode, renameNode, generateId, getNode, getAllFiles } from '../lib/vfs';

export function FileManager() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<{id: string | null, name: string}[]>([{id: null, name: 'On My Device'}]);
  const [nodes, setNodes] = useState<VFSNode[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedNode, setSelectedNode] = useState<VFSNode | null>(null);
  const [previewNode, setPreviewNode] = useState<VFSNode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeTab, setActiveTab] = useState<'browse' | 'recents'>('browse');
  const [uploadingFiles, setUploadingFiles] = useState<{id: string, name: string, progress: number, mimeType: string}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadNodes();
    
    const handleVfsUpdate = () => loadNodes();
    window.addEventListener('vfs-updated', handleVfsUpdate);
    return () => window.removeEventListener('vfs-updated', handleVfsUpdate);
  }, [currentFolderId, activeTab]);

  const loadNodes = async () => {
    if (activeTab === 'recents') {
      const allFiles = await getAllFiles();
      allFiles.sort((a, b) => b.createdAt - a.createdAt);
      setNodes(allFiles);
    } else {
      const fetchedNodes = await getNodesByParent(currentFolderId);
      // Sort: Folders first, then alphabetically
      fetchedNodes.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      });
      setNodes(fetchedNodes);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const newNode: VFSNode = {
      id: generateId(),
      name: newFolderName.trim(),
      type: 'folder',
      parentId: currentFolderId,
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };
    await addNode(newNode);
    setNewFolderName('');
    setIsCreatingFolder(false);
    loadNodes();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newUploads = Array.from(files).map(file => ({
      id: generateId(),
      file,
      name: file.name,
      progress: 0,
      mimeType: file.type
    }));

    setUploadingFiles(prev => [...prev, ...newUploads.map(u => ({ id: u.id, name: u.name, progress: 0, mimeType: u.mimeType }))]);

    await Promise.all(newUploads.map(async (upload) => {
      return new Promise<void>(resolve => {
        let progress = 0;
        const interval = setInterval(async () => {
          progress += Math.random() * 20 + 10; // 10-30% per tick
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            const newNode: VFSNode = {
              id: upload.id,
              name: upload.file.name,
              type: 'file',
              parentId: currentFolderId,
              data: upload.file,
              mimeType: upload.file.type,
              size: upload.file.size,
              createdAt: Date.now(),
              modifiedAt: Date.now()
            };
            await addNode(newNode);
            
            setUploadingFiles(prev => prev.filter(f => f.id !== upload.id));
            loadNodes();
            resolve();
          } else {
            setUploadingFiles(prev => prev.map(f => f.id === upload.id ? { ...f, progress } : f));
          }
        }, 200);
      });
    }));
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const navigateToFolder = (folder: VFSNode) => {
    setCurrentFolderId(folder.id);
    setFolderHistory([...folderHistory, { id: folder.id, name: folder.name }]);
  };

  const navigateBack = () => {
    if (folderHistory.length <= 1) return;
    const newHistory = [...folderHistory];
    newHistory.pop();
    setFolderHistory(newHistory);
    setCurrentFolderId(newHistory[newHistory.length - 1].id);
  };

  const handleDelete = async (id: string) => {
    await deleteNode(id);
    setSelectedNode(null);
    loadNodes();
  };

  const handleRename = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed) {
      await renameNode(id, trimmed);
      setSelectedNode(null);
      loadNodes();
    }
  };

  const openPreview = async (node: VFSNode) => {
    if (node.type === 'folder') {
      navigateToFolder(node);
      return;
    }
    
    // Fetch full node to get data blob if not loaded
    const fullNode = await getNode(node.id);
    if (fullNode?.data) {
      const url = URL.createObjectURL(fullNode.data);
      setPreviewUrl(url);
      setPreviewNode(fullNode);
      setIsPlaying(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewNode(null);
    setIsPlaying(false);
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getIcon = (node: VFSNode) => {
    if (node.type === 'folder') return <Folder className="w-12 h-12 text-blue-400 fill-blue-400/20" />;
    if (node.mimeType?.startsWith('image/')) return <ImageIcon className="w-12 h-12 text-purple-400" />;
    if (node.mimeType?.startsWith('audio/')) return <Music className="w-12 h-12 text-pink-400" />;
    if (node.mimeType?.startsWith('video/')) return <Video className="w-12 h-12 text-indigo-400" />;
    return <FileIcon className="w-12 h-12 text-gray-400" />;
  };

  const currentFolderName = folderHistory[folderHistory.length - 1].name;

  return (
    <div className="h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white flex flex-col relative overflow-hidden font-sans">
      {/* Header */}
      <div className="pt-12 pb-4 px-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 z-10 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          {activeTab === 'browse' && folderHistory.length > 1 ? (
            <button onClick={navigateBack} className="flex items-center text-blue-500 font-medium">
              <ChevronLeft className="w-6 h-6 -ml-2" />
              <span>Back</span>
            </button>
          ) : (
            <div className="w-16" /> // Spacer
          )}
          <div className="flex gap-3 items-center">
            <button 
              onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} 
              className="p-2 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 rounded-full transition-colors active:scale-95"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
            {activeTab === 'browse' && (
              <button 
                onClick={() => setIsCreatingFolder(true)} 
                className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-full font-medium shadow-sm hover:bg-blue-600 transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm">New Folder</span>
              </button>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 rounded-full transition-colors active:scale-95">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{activeTab === 'recents' ? 'Recents' : currentFolderName}</h1>
        
        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-black/5 dark:bg-white/10 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        multiple 
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isCreatingFolder && (
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl mb-4 shadow-sm">
            <Folder className="w-8 h-8 text-blue-400 fill-blue-400/20" />
            <input
              autoFocus
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              onBlur={() => setIsCreatingFolder(false)}
              placeholder="New Folder"
              className="flex-1 bg-transparent focus:outline-none text-lg"
            />
          </div>
        )}

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {uploadingFiles.map(file => (
              <div key={file.id} className="flex flex-col items-center gap-2 relative group opacity-60">
                <div className="w-full aspect-square bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm relative overflow-hidden">
                  {getIcon({ type: 'file', mimeType: file.mimeType } as VFSNode)}
                  <div className="absolute inset-0 bg-black/5 dark:bg-black/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-4 border-black/10 dark:border-white/10 border-t-blue-500 animate-spin" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 dark:bg-zinc-800">
                    <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${file.progress}%` }} />
                  </div>
                </div>
                <span className="text-xs text-center line-clamp-2 font-medium break-all px-1">
                  {file.name}
                </span>
                <span className="text-[10px] text-blue-500 font-medium">{Math.round(file.progress)}%</span>
              </div>
            ))}
            {nodes.map(node => (
              <div 
                key={node.id} 
                className="flex flex-col items-center gap-2 relative group"
              >
                <button 
                  onClick={() => openPreview(node)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectedNode(node);
                  }}
                  className="w-full aspect-square bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm hover:scale-95 transition-transform"
                >
                  {getIcon(node)}
                </button>
                <span className="text-xs text-center line-clamp-2 font-medium break-all px-1">
                  {node.name}
                </span>
                {node.size && <span className="text-[10px] text-gray-500">{formatSize(node.size)}</span>}

                {/* Context Menu Overlay (Simplified) */}
                {selectedNode?.id === node.id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-black/5 dark:border-white/10 z-20 w-40 overflow-hidden">
                    <button 
                      onClick={() => {
                        const newName = prompt('Rename:', node.name);
                        if (newName) handleRename(node.id, newName);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/10"
                    >
                      <Edit2 className="w-4 h-4" /> Rename
                    </button>
                    <button 
                      onClick={() => handleDelete(node.id)}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
            {nodes.length === 0 && uploadingFiles.length === 0 && !isCreatingFolder && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Folder className="w-16 h-16 mb-4 opacity-20" />
                <p className="mb-6">{activeTab === 'recents' ? 'No recent files' : 'Folder is empty'}</p>
                {activeTab === 'browse' && (
                  <button 
                    onClick={() => setIsCreatingFolder(true)}
                    className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-blue-600 transition-colors active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Folder
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {uploadingFiles.map(file => (
              <div key={file.id} className="flex items-center gap-4 p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm opacity-60 relative overflow-hidden">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center relative">
                  {getIcon({ type: 'file', mimeType: file.mimeType } as VFSNode)}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-black/10 dark:border-white/10 border-t-blue-500 animate-spin" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${file.progress}%` }} />
                  </div>
                </div>
                <span className="text-xs text-blue-500 font-medium w-10 text-right">{Math.round(file.progress)}%</span>
              </div>
            ))}
            {nodes.map(node => (
              <div 
                key={node.id} 
                className="flex items-center gap-4 p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors relative group cursor-pointer"
                onClick={() => openPreview(node)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectedNode(node);
                }}
              >
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                  {getIcon(node)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{node.name}</p>
                  <p className="text-xs text-gray-500">
                    {node.type === 'folder' ? 'Folder' : formatSize(node.size)} • {new Date(node.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-500"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {/* Context Menu Overlay */}
                {selectedNode?.id === node.id && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-black/5 dark:border-white/10 z-20 w-40 overflow-hidden">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt('Rename:', node.name);
                        if (newName) handleRename(node.id, newName);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/10"
                    >
                      <Edit2 className="w-4 h-4" /> Rename
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(node.id);
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
            {nodes.length === 0 && uploadingFiles.length === 0 && !isCreatingFolder && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Folder className="w-16 h-16 mb-4 opacity-20" />
                <p className="mb-6">{activeTab === 'recents' ? 'No recent files' : 'Folder is empty'}</p>
                {activeTab === 'browse' && (
                  <button 
                    onClick={() => setIsCreatingFolder(true)}
                    className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-blue-600 transition-colors active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Folder
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-black/5 dark:border-white/10 flex justify-around items-center p-2 pb-safe">
        <button 
          onClick={() => setActiveTab('recents')}
          className={`flex flex-col items-center gap-1 p-2 w-20 ${activeTab === 'recents' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <List className="w-6 h-6" />
          <span className="text-[10px] font-medium">Recents</span>
        </button>
        <button 
          onClick={() => setActiveTab('browse')}
          className={`flex flex-col items-center gap-1 p-2 w-20 ${activeTab === 'browse' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <Folder className="w-6 h-6" />
          <span className="text-[10px] font-medium">Browse</span>
        </button>
      </div>

      {/* Click outside to close context menu */}
      {selectedNode && (
        <div 
          className="absolute inset-0 z-10" 
          onClick={() => setSelectedNode(null)} 
        />
      )}

      {/* Media Preview Modal */}
      <AnimatePresence>
        {previewNode && previewUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-4 pt-12 text-white">
              <button onClick={closePreview} className="text-blue-400 font-medium">Done</button>
              <span className="font-semibold text-sm truncate max-w-[200px]">{previewNode.name}</span>
              <button className="text-blue-400"><Download className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {previewNode.mimeType?.startsWith('image/') && (
                <img src={previewUrl} alt={previewNode.name} className="max-w-full max-h-full object-contain rounded-lg" />
              )}
              
              {previewNode.mimeType?.startsWith('video/') && (
                <video src={previewUrl} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-2xl" />
              )}

              {previewNode.mimeType?.startsWith('audio/') && (
                <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-8 flex flex-col items-center shadow-2xl border border-white/10">
                  <div className="w-48 h-48 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-8 flex items-center justify-center shadow-lg">
                    <Music className="w-20 h-20 text-white/50" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2 text-center w-full truncate">{previewNode.name}</h2>
                  <p className="text-zinc-400 text-sm mb-8">Audio File</p>
                  
                  <audio 
                    ref={audioRef} 
                    src={previewUrl} 
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                  />
                </div>
              )}

              {!previewNode.mimeType?.startsWith('image/') && 
               !previewNode.mimeType?.startsWith('video/') && 
               !previewNode.mimeType?.startsWith('audio/') && (
                <div className="flex flex-col items-center text-white/50">
                  <FileIcon className="w-24 h-24 mb-4" />
                  <p>Preview not available for this file type</p>
                  <p className="text-sm mt-2">{formatSize(previewNode.size)}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
