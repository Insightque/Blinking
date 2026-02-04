
import React from 'react';

export const LoadingView: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center">
      <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tighter mt-10 uppercase animate-pulse">Processing with AI</h2>
    </div>
  );
};
