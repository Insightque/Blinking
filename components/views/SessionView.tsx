
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, ChevronRight, ChevronLeft, Repeat, Volume2, Minus, Plus, Quote } from 'lucide-react';
import { WordItem, SessionSettings } from '../../types';
import { Header } from '../Header';
import { Button } from '../Button';
import { playSound, speakEnglish, speakKorean, stopSpeech } from '../../services/audioService';

type SessionPhase = 'IDLE' | 'READING_KOREAN' | 'COUNTDOWN' | 'READING_ENGLISH' | 'WAIT_NEXT';

interface SessionViewProps {
  topic: string;
  words: WordItem[];
  settings: SessionSettings;
  onFinish: () => void;
  onExit: () => void;
  onOpenSettings: () => void;
  onUpdateSettings: (newSettings: SessionSettings) => void;
  onRecordStudy: (wordId: string) => void;
}

export const SessionView: React.FC<SessionViewProps> = ({
  topic,
  words,
  settings,
  onFinish,
  onExit,
  onOpenSettings,
  onUpdateSettings,
  onRecordStudy
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<SessionPhase>('IDLE');
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef<any>(null);
  const tickIntervalRef = useRef<any>(null);
  const currentWord = words[currentIndex];

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
  }, []);

  const handleNextWord = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setPhase('IDLE');
      playSound('pop');
    } else {
      stopSpeech();
      clearTimers();
      onFinish();
    }
  }, [currentIndex, words, clearTimers, onFinish]);

  const handlePreviousWord = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setPhase('IDLE');
      playSound('pop');
    }
  }, [currentIndex]);

  const handleExit = useCallback(() => {
    if (confirm("학습을 종료하고 목록으로 돌아가시겠습니까?")) {
      stopSpeech();
      clearTimers();
      onExit();
    }
  }, [clearTimers, onExit]);

  const togglePause = useCallback(() => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    if (newPausedState) {
      stopSpeech();
      clearTimers();
    }
  }, [isPaused, clearTimers]);

  // 학습 단계 시퀀스 제어
  useEffect(() => {
    if (isPaused) return;

    const runPhase = async () => {
      clearTimers();

      switch (phase) {
        case 'IDLE':
          setPhase('READING_KOREAN');
          break;

        case 'READING_KOREAN':
          if (settings.readKoreanAloud) {
            await speakKorean(currentWord.korean);
          }
          setPhase('COUNTDOWN');
          break;

        case 'COUNTDOWN':
          // 한글 읽기가 끝난 후 카운트다운 시작
          tickIntervalRef.current = setInterval(() => playSound('tick'), 1000);
          timerRef.current = setTimeout(() => {
            clearInterval(tickIntervalRef.current);
            setPhase('READING_ENGLISH');
          }, settings.revealDelay * 1000);
          break;

        case 'READING_ENGLISH':
          // 영어 음성 재생
          onRecordStudy(currentWord.id);
          await speakEnglish(currentWord.english);
          setPhase('WAIT_NEXT');
          break;

        case 'WAIT_NEXT':
          // 영어 음성 재생이 끝난 후 자동 전환 대기
          timerRef.current = setTimeout(() => {
            handleNextWord();
          }, settings.autoAdvanceDelay * 1000);
          break;
      }
    };

    runPhase();

    return () => clearTimers();
  }, [phase, isPaused, currentIndex, currentWord, settings, onRecordStudy, handleNextWord, clearTimers]);

  const renderKorean = (text: string) => {
    if (text.includes('/')) {
      return (
        <div className="flex flex-wrap justify-center items-center gap-x-2 sm:gap-x-3 gap-y-1 sm:gap-y-2">
          {text.split('/').map((part, i, arr) => (
            <React.Fragment key={i}>
              <span className="text-slate-900 font-black">{part.trim()}</span>
              {i < arr.length - 1 && <span className="text-indigo-200 font-thin text-2xl sm:text-3xl">/</span>}
            </React.Fragment>
          ))}
        </div>
      );
    }
    return text;
  };

  const isEnglishRevealed = phase === 'READING_ENGLISH' || phase === 'WAIT_NEXT';
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col select-none overflow-hidden">
      <Header 
        topic={topic} 
        currentIndex={currentIndex} 
        total={words.length} 
        progress={progress} 
        onExit={handleExit} 
        onOpenSettings={onOpenSettings} 
      />
      
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-2xl">
          <div key={currentIndex} className="bg-white rounded-[3rem] sm:rounded-[4rem] shadow-2xl overflow-hidden min-h-[500px] sm:min-h-[550px] flex flex-col relative animate-in fade-in slide-in-from-bottom-4 border-b-8 border-indigo-600">
            <div className="px-6 sm:px-10 py-6 sm:py-8 flex justify-between items-center bg-slate-50/40 border-b">
              <span className="px-3 sm:px-5 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                {currentWord?.partOfSpeech}
              </span>
              <div className="flex items-center gap-2 sm:gap-3 text-indigo-600 bg-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-indigo-50 shadow-sm">
                <Repeat size={14} className="sm:size-[16px]" strokeWidth={3} />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">{currentWord?.reviewCount || 0} Mastery</span>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-14 text-center">
              <div className="space-y-4 sm:space-y-8 mb-8 sm:mb-12 w-full">
                <span className="text-slate-300 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">
                  {currentWord?.partOfSpeech.includes('Type') ? "Structure Study" : "OPIc Training"}
                </span>
                <div className={`font-black text-slate-900 tracking-tight leading-tight ${currentWord?.korean.length > 50 ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-5xl'}`}>
                  {renderKorean(currentWord?.korean || "")}
                </div>
              </div>
              
              {isEnglishRevealed ? (
                <div className="space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-500 w-full flex flex-col items-center">
                  <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-indigo-600 rounded-full shadow-sm"></div>
                  <div className="space-y-2 sm:space-y-4 w-full">
                    <span className="text-indigo-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1 sm:gap-2">
                      <Volume2 size={16} className="sm:size-[20px]" /> {phase === 'READING_ENGLISH' ? 'Playing Audio' : 'Ready for Next'}
                    </span>
                    <h3 className={`font-black text-indigo-700 tracking-tighter leading-tight ${currentWord?.english.length > 80 ? 'text-base sm:text-xl' : currentWord?.english.length > 40 ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-4xl'}`}>
                      {currentWord?.english}
                    </h3>
                    
                    {currentWord?.example && (
                      <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100 max-w-lg mx-auto relative group">
                        <Quote size={20} className="absolute -top-3 -left-1 text-indigo-200 fill-indigo-50" />
                        <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed italic">
                          {currentWord.example}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-32 sm:h-40 flex items-center justify-center gap-3 sm:gap-4">
                  {phase === 'READING_KOREAN' ? (
                    <div className="flex flex-col items-center gap-3">
                       <Volume2 className="text-indigo-400 animate-pulse" size={24} />
                       <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Listening...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-indigo-100 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-slate-50/90 p-6 sm:p-10 border-t space-y-6 sm:space-y-10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-5 bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm border">
                  <button 
                    type="button"
                    onClick={() => onUpdateSettings({...settings, autoAdvanceDelay: Math.max(1, settings.autoAdvanceDelay - 1)})} 
                    className="p-1.5 sm:p-2.5 hover:bg-slate-50 rounded-lg sm:rounded-xl text-slate-400 transition-colors"
                  >
                    <Minus size={18} className="sm:size-[20px]" />
                  </button>
                  <span className="text-base sm:text-xl font-black text-slate-800 min-w-[2rem] sm:min-w-[3rem] text-center tabular-nums">{settings.autoAdvanceDelay}s</span>
                  <button 
                    type="button"
                    onClick={() => onUpdateSettings({...settings, autoAdvanceDelay: Math.min(10, settings.autoAdvanceDelay + 1)})} 
                    className="p-1.5 sm:p-2.5 hover:bg-slate-50 rounded-lg sm:rounded-xl text-slate-400 transition-colors"
                  >
                    <Plus size={18} className="sm:size-[20px]" />
                  </button>
                </div>
                <div className="px-3 sm:px-6 py-2 sm:py-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border flex items-center gap-2 sm:gap-4">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isPaused ? 'bg-slate-300' : isEnglishRevealed ? 'bg-teal-500 animate-pulse' : 'bg-indigo-600 animate-pulse'}`} />
                  <span className="text-[10px] sm:text-xs text-slate-400 font-black uppercase tracking-widest">
                    {isPaused ? 'Paused' : phase}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-3 sm:gap-6">
                <Button type="button" onClick={handlePreviousWord} disabled={currentIndex === 0} variant="secondary" className="px-4 sm:px-10 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem]">
                  <ChevronLeft size={24} className="sm:size-[32px]" />
                </Button>
                <Button type="button" onClick={togglePause} variant={isPaused ? "primary" : "outline"} className="flex-1 flex items-center justify-center gap-2 sm:gap-4 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] text-xs sm:text-base font-black uppercase tracking-tight sm:tracking-[0.2em] shadow-lg">
                  {isPaused ? <><Play size={20} className="sm:size-[28px]" fill="currentColor" /> Resume</> : <><Pause size={20} className="sm:size-[28px]" fill="currentColor" /> Pause</>}
                </Button>
                <Button type="button" onClick={handleNextWord} className="px-4 sm:px-10 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem]">
                  <ChevronRight size={24} className="sm:size-[32px]" />
                </Button>
              </div>
            </div>
            
            {!isPaused && (phase === 'COUNTDOWN' || phase === 'WAIT_NEXT') && (
              <div 
                key={`${currentIndex}-${phase}`} 
                className={`absolute bottom-0 left-0 h-2 sm:h-2.5 transition-all ease-linear shadow-sm ${phase === 'WAIT_NEXT' ? 'bg-teal-500' : 'bg-indigo-600'}`}
                style={{ 
                  width: '100%', 
                  animation: `timerProgress ${phase === 'WAIT_NEXT' ? settings.autoAdvanceDelay : settings.revealDelay}s linear forwards` 
                }} 
              />
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes timerProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};
