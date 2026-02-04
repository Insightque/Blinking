
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../Button';

interface SummaryViewProps {
  onRestart: () => void;
  onGoToTopics: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ onRestart, onGoToTopics }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-600 p-6">
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl max-w-sm w-full text-center space-y-8 animate-in zoom-in">
        <div className="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center mx-auto text-green-600 border-4 border-white shadow-xl rotate-3">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Well Done!</h2>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={onRestart} className="py-5 text-xl rounded-2xl font-black">Restart</Button>
          <Button variant="secondary" onClick={onGoToTopics} className="py-5 text-lg rounded-2xl font-bold">Topic List</Button>
        </div>
      </div>
    </div>
  );
};
