
import React from 'react';
import { ChevronLeft, Database, PlusCircle, MessageSquare, Trash2, X, Quote, ListMusic, Sparkles, Play } from 'lucide-react';
import { WordSet, SentenceSet, Category } from '../../types';
import { Button } from '../Button';

interface SetListViewProps {
  category: Category;
  availableSets: WordSet[];
  onBack: () => void;
  onStartSession: (set: WordSet | SentenceSet) => void;
  onDeleteSet: (id: string) => void;
  onGenerateSentences: (set: WordSet) => void;
  sentenceSetsMap: Record<string, SentenceSet[]>;
  onDeleteSentenceSet: (id: string) => void;
}

export const SetListView: React.FC<SetListViewProps> = ({
  category,
  availableSets,
  onBack,
  onStartSession,
  onDeleteSet,
  onGenerateSentences,
  sentenceSetsMap,
  onDeleteSentenceSet
}) => {
  const [pickerSet, setPickerSet] = React.useState<WordSet | null>(null);

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-2xl space-y-8">
        <header className="flex items-center justify-between border-b pb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black uppercase text-xs">
            <ChevronLeft size={18} /> Back
          </button>
          <div className="text-right">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{category} Collections</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{availableSets.length} Topics</p>
          </div>
        </header>

        <div className="grid gap-4">
          {availableSets.map(set => (
            <div key={set.id} className="group p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-indigo-500 hover:bg-white transition-all shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-5 cursor-pointer flex-1" onClick={() => onStartSession(set)}>
                 <div className={`p-4 rounded-2xl ${set.id.startsWith('seed') ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-50'}`}>
                    <Database size={22} />
                 </div>
                 <div className="flex-1">
                    <h4 className="text-lg font-black text-slate-800 leading-tight">{set.topic}</h4>
                    <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      <span className="flex items-center gap-1 font-black text-indigo-500">
                        <PlusCircle size={12} /> {set.words.length} Items
                      </span>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                 <button onClick={() => onStartSession(set)} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase">Study</button>
                 <button 
                   title="OPIc AI Responses" 
                   onClick={() => setPickerSet(set)} 
                   className="p-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all"
                 >
                   <MessageSquare size={18} />
                 </button>
                 {!set.id.startsWith('seed') && (
                   <button 
                     onClick={() => onDeleteSet(set.id)} 
                     className="p-2.5 text-slate-300 hover:text-red-500 transition-colors"
                   >
                     <Trash2 size={18} />
                   </button>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {pickerSet && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Response Sets</h3>
               <button onClick={() => setPickerSet(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                 <X size={20} />
               </button>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {(sentenceSetsMap[pickerSet.id] || []).map((ss) => (
                <div key={ss.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                  <div className="cursor-pointer flex-1" onClick={() => { onStartSession(ss); setPickerSet(null); }}>
                    <div className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Quote size={14} className="text-teal-500" /> AI Response Set
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { onStartSession(ss); setPickerSet(null); }} 
                      className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl"
                    >
                      <Play size={18} fill="currentColor" />
                    </button>
                    <button 
                      onClick={() => onDeleteSentenceSet(ss.id)} 
                      className="p-2 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {(!sentenceSetsMap[pickerSet.id] || sentenceSetsMap[pickerSet.id].length === 0) && (
                <div className="text-center py-12 text-slate-300">
                  <ListMusic size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">No response sets generated.</p>
                </div>
              )}
            </div>
            
            <Button 
              onClick={() => { onGenerateSentences(pickerSet); setPickerSet(null); }} 
              className="w-full mt-8 py-4 rounded-2xl flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 shadow-teal-100"
            >
              <Sparkles size={18} /> Generate New OPIc Responses
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
