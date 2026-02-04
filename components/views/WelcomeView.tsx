
import React from 'react';
import { BookOpen, Languages, PlusCircle, Settings } from 'lucide-react';
import { Category } from '../../types';
import { HomeCard } from '../HomeCard';
import { Button } from '../Button';

interface WelcomeViewProps {
  counts: Record<string, number>;
  onLoadCategory: (cat: Category) => void;
  onOpenGenerator: () => void;
  onOpenSettings: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ counts, onLoadCategory, onOpenGenerator, onOpenSettings }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
            Lingo<span className="text-indigo-600">Focus</span>
          </h1>
          <p className="text-slate-400 text-sm font-semibold tracking-tight">Professional Memory Trainer</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <HomeCard 
            icon={<Languages size={18} />} 
            title="S+V Pattern Practice" 
            desc={`${counts[Category.SUBJECT_VERB] || 0} patterns`}
            color="indigo"
            onClick={() => onLoadCategory(Category.SUBJECT_VERB)}
          />
          <HomeCard 
            icon={<BookOpen size={18} />} 
            title="OPIc Preparation" 
            desc={`${counts[Category.OPIC] || 0} phrases`}
            color="orange"
            onClick={() => onLoadCategory(Category.OPIC)}
          />
          <Button 
            onClick={onOpenGenerator} 
            variant="secondary" 
            className="flex items-center justify-center gap-2 py-4 rounded-2xl border-dashed border-2 bg-transparent text-indigo-600 border-indigo-200 hover:border-indigo-600 mt-2"
          >
            <PlusCircle size={20} /> AI Custom Set Generation
          </Button>
        </div>

        <button 
          onClick={onOpenSettings} 
          className="text-slate-400 font-bold text-[9px] uppercase tracking-widest pt-4 flex items-center justify-center gap-1.5 hover:text-indigo-600 transition-colors"
        >
          <Settings size={12} /> Global Preferences
        </button>
      </div>
    </div>
  );
};
