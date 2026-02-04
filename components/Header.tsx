
import React from 'react';
import { X, Settings } from 'lucide-react';

interface HeaderProps {
  topic: string;
  currentIndex: number;
  total: number;
  progress: number;
  onExit: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  topic, 
  currentIndex, 
  total, 
  progress, 
  onExit, 
  onOpenSettings 
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onExit();
          }} 
          className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 transition-all active:scale-90"
          title="Exit Session"
        >
          <X size={20} strokeWidth={3} />
        </button>
        <div className="text-left hidden sm:block">
           <span className="font-black text-xl text-slate-800 tracking-tighter block leading-none">LingoFocus</span>
           <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate max-w-[150px]">{topic}</span>
        </div>
      </div>
      <div className="flex-1 max-w-md mx-4 md:mx-10">
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[11px] text-center text-slate-400 mt-2 font-black uppercase tracking-widest">{currentIndex + 1} / {total}</p>
      </div>
      <button 
        type="button"
        onClick={onOpenSettings} 
        className="p-3 hover:bg-slate-50 rounded-2xl text-slate-500 transition-all active:scale-90"
      >
        <Settings size={22} />
      </button>
    </header>
  );
};
