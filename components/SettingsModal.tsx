
import React, { useRef } from 'react';
import { X, Trash2, RefreshCcw, Download, Upload } from 'lucide-react';
import { Button } from './Button';
import { clearAllData, exportBackup, importBackup } from '../services/storageService';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    if (confirm("정말 초기화하시겠습니까? 모든 커스텀 세트와 학습 기록이 삭제됩니다.")) {
      clearAllData();
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const success = importBackup(result);
        if (success) {
          alert("데이터를 성공적으로 불러왔습니다. 앱을 다시 시작합니다.");
          window.location.reload();
        } else {
          alert("잘못된 파일 형식입니다.");
        }
      }
    };
    reader.readAsText(file);
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
        
        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
          {/* Reveal Delay */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              정답 노출 대기 시간
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
          </div>

          {/* Auto Advance Delay */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              자동 다음 카드 전환 시간
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
          </div>

          {/* Batch Size */}
          <div>
             <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              학습 세션 분량
            </label>
            <select 
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-600 font-black text-slate-800 transition-all shadow-inner"
            >
              <option value={10}>10개 표현 (퀵 리뷰)</option>
              <option value={50}>50개 표현 (집중 학습)</option>
              <option value={100}>100개 표현 (표준)</option>
            </select>
          </div>

          {/* Backup & Sync */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
             <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
              데이터 동기화 및 백업 (브라우저 간 이동)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={exportBackup}
                className="flex items-center justify-center gap-2 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-black text-indigo-600 hover:border-indigo-600 hover:bg-white transition-all"
              >
                <Download size={14} /> 백업 내보내기
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-black text-teal-600 hover:border-teal-600 hover:bg-white transition-all"
              >
                <Upload size={14} /> 백업 불러오기
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImport} 
                className="hidden" 
                accept=".json"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-3 py-4 text-red-500 font-black text-xs uppercase tracking-[0.15em] hover:bg-red-50 rounded-2xl transition-colors"
            >
              <RefreshCcw size={16} /> 모든 기록 및 데이터 초기화
            </button>
          </div>
        </div>

        <div className="mt-8">
          <Button fullWidth onClick={onClose} className="py-5 text-sm uppercase tracking-[0.2em]">
            적용 완료
          </Button>
        </div>
      </div>
    </div>
  );
};
