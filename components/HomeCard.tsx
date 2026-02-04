
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface HomeCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: 'orange' | 'indigo';
  onClick: () => void;
}

export const HomeCard: React.FC<HomeCardProps> = ({ icon, title, desc, color, onClick }) => {
  const themes = {
    orange: "bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-500 hover:bg-orange-100 shadow-orange-100/20",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-100 shadow-indigo-100/20"
  };

  return (
    <div 
      onClick={onClick} 
      className={`group cursor-pointer p-6 rounded-[2.5rem] shadow-sm transition-all border-2 flex items-center text-left gap-6 w-full ${themes[color]} transform active:scale-[0.98]`}
    >
      <div className="p-5 bg-white rounded-3xl shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-black tracking-tight uppercase leading-none">{title}</h3>
        <p className="text-slate-500 text-[11px] font-bold leading-tight opacity-70 truncate mt-2 uppercase tracking-wide">{desc}</p>
      </div>
      <div className="text-slate-300 group-hover:text-slate-900 transition-colors">
        <ChevronRight size={28} strokeWidth={3} />
      </div>
    </div>
  );
};
