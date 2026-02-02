import React from 'react';
import { X, Trash2, RefreshCcw } from 'lucide-react';
import { Button } from './Button';
import { clearAllData } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  delay: number;
  setDelay: (val: number) => void;
  autoAdvanceDelay: number;
  setAutoAdvanceDelay: (val: number) => void;
  batchSize: number;
  setBatchSize: (val: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  delay,
  setDelay,
  autoAdvanceDelay,
  setAutoAdvanceDelay,
  batchSize,
  setBatchSize
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    if (confirm("Are you sure? This will delete all custom sets and review progress.")) {
      clearAllData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-black text-slate-800 mb-8 tracking-tighter uppercase">Preferences</h2>
        
        <div className="space-y-8">
          {/* Reveal Delay */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Answer Reveal Delay
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={delay} 
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="w-14 text-center font-black text-indigo-600 bg-indigo-50 py-2 rounded-xl text-sm shadow-sm border border-indigo-100">
                {delay}s
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-wide italic">Time before showing English.</p>
          </div>

          {/* Auto Advance Delay */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Auto Advance Delay
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={autoAdvanceDelay} 
                onChange={(e) => setAutoAdvanceDelay(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <span className="w-14 text-center font-black text-teal-600 bg-teal-50 py-2 rounded-xl text-sm shadow-sm border border-teal-100">
                {autoAdvanceDelay}s
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-wide italic">Time before next flashcard.</p>
          </div>

          {/* Batch Size */}
          <div>
             <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Session Length
            </label>
            <select 
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-600 font-black text-slate-800 transition-all shadow-inner"
            >
              <option value={10}>10 Expressions (Quick)</option>
              <option value={50}>50 Expressions (Focused)</option>
              <option value={100}>100 Expressions (Standard)</option>
              <option value={200}>200 Expressions (Immersion)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-3 py-4 text-red-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-red-50 rounded-2xl transition-colors"
            >
              <RefreshCcw size={16} /> Reset All Progress & Data
            </button>
          </div>
        </div>

        <div className="mt-10">
          <Button fullWidth onClick={onClose} className="py-5 text-sm uppercase tracking-[0.2em]">
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
