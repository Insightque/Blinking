
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Play, Pause, BookOpen, Brain, ChevronRight, ChevronLeft, CheckCircle2, Home, Clock, Plus, Minus, Repeat } from 'lucide-react';
import { AppMode, Category, SessionSettings, WordItem } from './types';
import { getWordsFromDatabase } from './services/wordService';
import { Button } from './components/Button';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  // App State
  const [mode, setMode] = useState<AppMode>(AppMode.WELCOME);
  const [settings, setSettings] = useState<SessionSettings>({
    category: Category.OPIC,
    revealDelay: 3,
    autoAdvanceDelay: 3,
    batchSize: 100
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [words, setWords] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEnglishRevealed, setIsEnglishRevealed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Timer Refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Handlers ---

  const handleStartSession = async (category: Category) => {
    setSettings(prev => ({ ...prev, category }));
    setMode(AppMode.LOADING);
    
    try {
      const newWords = await getWordsFromDatabase(category, settings.batchSize);
      setWords(newWords);
      setCurrentIndex(0);
      setIsEnglishRevealed(false);
      setIsPaused(false);
      setMode(AppMode.SESSION);
    } catch (error) {
      console.error("Failed to load words", error);
      setMode(AppMode.WELCOME);
    }
  };

  const handleNextWord = useCallback(() => {
    setWords(currentWords => {
        if (currentIndex < currentWords.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsEnglishRevealed(false);
            return currentWords;
        } else {
            setMode(AppMode.SUMMARY);
            return currentWords;
        }
    });
  }, [currentIndex]);

  const handlePreviousWord = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsEnglishRevealed(false);
    }
  }, [currentIndex]);

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const adjustAutoDelay = (delta: number) => {
    setSettings(prev => ({
      ...prev,
      autoAdvanceDelay: Math.max(1, Math.min(10, prev.autoAdvanceDelay + delta))
    }));
  };

  // --- Timing Logic ---
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (mode === AppMode.SESSION && !isPaused) {
      if (!isEnglishRevealed) {
        timerRef.current = setTimeout(() => {
          setIsEnglishRevealed(true);
        }, settings.revealDelay * 1000);
      } else {
        timerRef.current = setTimeout(() => {
           handleNextWord();
        }, settings.autoAdvanceDelay * 1000);
      }
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mode, currentIndex, isEnglishRevealed, isPaused, settings.revealDelay, settings.autoAdvanceDelay, handleNextWord]);

  // --- Renders ---

  if (mode === AppMode.WELCOME) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="w-full max-w-4xl text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
              Lingo<span className="text-indigo-600">Focus</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl">Professional Vocabulary Trainer</p>
            <p className="text-slate-400 text-sm">Database: 1,500+ OPIc Words / 1,500+ AI & Engineering Words</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto mt-12">
            <div onClick={() => handleStartSession(Category.OPIC)} className="group cursor-pointer bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-indigo-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><BookOpen size={100} className="text-indigo-600" /></div>
              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600"><BookOpen size={32} /></div>
                <h3 className="text-2xl font-bold text-slate-800">OPIc Prep</h3>
                <p className="text-slate-500 text-sm">Essential speaking expressions for high scores.</p>
                <div className="pt-4"><span className="text-indigo-600 font-semibold group-hover:underline">Start &rarr;</span></div>
              </div>
            </div>

            <div onClick={() => handleStartSession(Category.AI_ENGINEERING)} className="group cursor-pointer bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-indigo-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Brain size={100} className="text-indigo-600" /></div>
              <div className="relative z-10 flex flex-col items-center space-y-4">
                 <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><Brain size={32} /></div>
                <h3 className="text-2xl font-bold text-slate-800">AI & Engineering</h3>
                <p className="text-slate-500 text-sm">Technical terminology for research and development.</p>
                <div className="pt-4"><span className="text-indigo-600 font-semibold group-hover:underline">Start &rarr;</span></div>
              </div>
            </div>
          </div>

          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 mx-auto text-slate-400 hover:text-slate-600 transition-colors">
            <Settings size={18} /><span>Settings</span>
          </button>
        </div>

        <SettingsModal 
          isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
          delay={settings.revealDelay} setDelay={(d) => setSettings(s => ({...s, revealDelay: d}))}
          autoAdvanceDelay={settings.autoAdvanceDelay} setAutoAdvanceDelay={(d) => setSettings(s => ({...s, autoAdvanceDelay: d}))}
          batchSize={settings.batchSize} setBatchSize={(b) => setSettings(s => ({...s, batchSize: b}))}
        />
      </div>
    );
  }

  if (mode === AppMode.LOADING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-slate-800">Loading Database...</h2>
      </div>
    );
  }

  if (mode === AppMode.SUMMARY) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600"><CheckCircle2 size={40} /></div>
          <h2 className="text-3xl font-bold text-slate-900">Session Complete!</h2>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button variant="secondary" onClick={() => setMode(AppMode.WELCOME)}>Home</Button>
            <Button onClick={() => handleStartSession(settings.category)}>Restart</Button>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode(AppMode.WELCOME)}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <span className="font-bold text-xl text-slate-800 hidden sm:inline">LingoFocus</span>
        </div>
        <div className="flex-1 max-w-md mx-6">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-center text-slate-400 mt-1 font-mono">{currentIndex + 1} / {words.length}</p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setMode(AppMode.WELCOME)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Home">
            <Home size={20} />
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl relative">
          <div key={currentIndex} className="bg-white rounded-3xl shadow-xl overflow-hidden min-h-[420px] flex flex-col relative animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="h-2 bg-indigo-500 w-full" />
            <div className="px-8 py-4 flex justify-between items-center border-b border-slate-50">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase">{currentWord?.partOfSpeech}</span>
              <div className="flex items-center gap-3">
                {currentWord?.reviewCount && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    <Repeat size={10} />
                    {currentWord.reviewCount}회독
                  </span>
                )}
                <span className="text-slate-300 font-mono text-xs">ID: {currentWord?.id.split('-')[1]}</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="space-y-2 mb-8">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">KOREAN</span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">{currentWord?.korean}</h2>
              </div>

              {isEnglishRevealed && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                  <div className="w-12 h-1 bg-indigo-100 mx-auto rounded-full mb-4"></div>
                  <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">ENGLISH</span>
                  <h3 className="text-3xl md:text-4xl font-bold text-indigo-600">{currentWord?.english}</h3>
                  {currentWord?.example && <p className="text-slate-500 text-base max-w-lg italic mt-2">"{currentWord.example}"</p>}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                  <button onClick={() => adjustAutoDelay(-1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Minus size={16} /></button>
                  <div className="flex items-center gap-2 px-1">
                    <Clock size={14} className="text-indigo-500" />
                    <span className="text-sm font-bold text-slate-700 min-w-[3rem] text-center">{settings.autoAdvanceDelay}s</span>
                  </div>
                  <button onClick={() => adjustAutoDelay(1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Plus size={16} /></button>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-200">
                  {isPaused ? <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Pause size={10} /> Paused</span> : (
                    <>
                      <div className={`w-2 h-2 rounded-full ${isEnglishRevealed ? 'bg-teal-500 animate-pulse' : 'bg-indigo-600'}`} />
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">{isEnglishRevealed ? 'Next word shortly' : 'Wait for answer'}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                <Button onClick={handlePreviousWord} disabled={currentIndex === 0} variant="secondary" className="px-6 py-4"><ChevronLeft size={24} /></Button>
                <Button onClick={togglePause} variant={isPaused ? "primary" : "outline"} className="flex-1 flex items-center justify-center gap-2 py-4">
                  {isPaused ? <><Play size={20} fill="currentColor" /> Resume</> : <><Pause size={20} fill="currentColor" /> Pause</>}
                </Button>
                <Button onClick={handleNextWord} className="px-6 py-4"><ChevronRight size={24} /></Button>
              </div>
            </div>
            {!isPaused && (
              <div key={`timer-${currentIndex}-${isEnglishRevealed}`} className={`absolute bottom-0 left-0 h-1 transition-all ease-linear ${isEnglishRevealed ? 'bg-teal-500' : 'bg-indigo-600'}`}
                 style={{ width: '100%', transitionDuration: isEnglishRevealed ? `${settings.autoAdvanceDelay}s` : `${settings.revealDelay}s` }} />
            )}
          </div>
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        delay={settings.revealDelay} setDelay={(d) => setSettings(s => ({...s, revealDelay: d}))}
        autoAdvanceDelay={settings.autoAdvanceDelay} setAutoAdvanceDelay={(d) => setSettings(s => ({...s, autoAdvanceDelay: d}))}
        batchSize={settings.batchSize} setBatchSize={(b) => setSettings(s => ({...s, batchSize: b}))}
      />
    </div>
  );
};

export default App;
