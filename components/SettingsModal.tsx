import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-slate-800 mb-6">Settings</h2>
        
        <div className="space-y-6">
          {/* Reveal Delay */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Answer Reveal Delay (Seconds)
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={delay} 
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="w-12 text-center font-mono font-bold text-indigo-600 bg-indigo-50 py-1 rounded-md">
                {delay}s
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Time to wait before showing the English meaning.</p>
          </div>

          {/* Auto Advance Delay */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Auto Advance Delay (Seconds)
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={autoAdvanceDelay} 
                onChange={(e) => setAutoAdvanceDelay(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="w-12 text-center font-mono font-bold text-teal-600 bg-teal-50 py-1 rounded-md">
                {autoAdvanceDelay}s
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Time to wait after answer before moving to next word.</p>
          </div>

          {/* Batch Size */}
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">
              Words per Session
            </label>
            <select 
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={10}>10 Words (Demo)</option>
              <option value={50}>50 Words</option>
              <option value={100}>100 Words (Standard)</option>
              <option value={200}>200 Words (Long)</option>
            </select>
          </div>
        </div>

        <div className="mt-8">
          <Button fullWidth onClick={onClose}>
            Save & Close
          </Button>
        </div>
      </div>
    </div>
  );
};