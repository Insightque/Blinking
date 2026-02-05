
import React from 'react';
import { Sparkles } from 'lucide-react';
import { Category } from '../../types';
import { Button } from '../Button';

interface GeneratorViewProps {
  onBack: () => void;
  onGenerate: (cat: Category, topic: string) => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({ onBack, onGenerate }) => {
  const [genCategory, setGenCategory] = React.useState<Category>(Category.OPIC);
  const [genTopic, setGenTopic] = React.useState('');

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white p-10 rounded-[3rem] shadow-2xl space-y-10 relative overflow-hidden">
         <header className="text-center space-y-3">
           <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-indigo-100">
             <Sparkles size={40} />
           </div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter">AI Topic Creator</h2>
         </header>
         <div className="space-y-8">
           <div className="space-y-4">
             <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">1. Category</label>
             <div className="grid grid-cols-2 gap-2">
               {[Category.OPIC, Category.SUBJECT_VERB, Category.SENTENCE_STRUCTURE].map(cat => (
                 <button 
                  key={cat} 
                  onClick={() => setGenCategory(cat)} 
                  className={`py-4 px-2 rounded-2xl text-[10px] font-black transition-all border-2 ${genCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                 >
                   {cat === Category.SUBJECT_VERB ? "S+V Pattern" : cat === Category.SENTENCE_STRUCTURE ? "1-5 Structures" : "OPIc Speaking"}
                 </button>
               ))}
             </div>
           </div>
           <div className="space-y-4">
             <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">2. Specific Topic</label>
             <input 
              type="text" 
              value={genTopic} 
              onChange={(e) => setGenTopic(e.target.value)} 
              placeholder="e.g. Work routine, My hobby..." 
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-bold" 
             />
           </div>
           <div className="flex gap-4 pt-4">
             <Button onClick={onBack} variant="secondary" className="flex-1 py-5 rounded-2xl">Cancel</Button>
             <Button 
              onClick={() => onGenerate(genCategory, genTopic)} 
              disabled={!genTopic.trim()} 
              className="flex-[2] py-5 rounded-2xl text-lg font-black"
             >
               Generate Patterns &rarr;
             </Button>
           </div>
         </div>
      </div>
    </div>
  );
};
