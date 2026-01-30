
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Play, Pause, BookOpen, Brain, ChevronRight, ChevronLeft, CheckCircle2, Home, Clock, Plus, Minus, Repeat, Sparkles, Copy, ClipboardCheck, Volume2 } from 'lucide-react';
import { AppMode, Category, SessionSettings, WordItem } from './types';
import { getWordsFromDatabase } from './services/wordService';
import { incrementReviewCount } from './services/storageService';
import { playSound, speakEnglish } from './services/audioService';
import { Button } from './components/Button';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.WELCOME);
  const [settings, setSettings] = useState<SessionSettings>({
    category: Category.OPIC,
    revealDelay: 3,
    autoAdvanceDelay: 3,
    batchSize: 50
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [words, setWords] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEnglishRevealed, setIsEnglishRevealed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [copied, setCopied] = useState(false);
  
  const timerRef = useRef<any>(null);
  const tickIntervalRef = useRef<any>(null);

  const handleStartSession = async (category: Category, customWords?: WordItem[]) => {
    setSettings(prev => ({ ...prev, category }));
    setMode(AppMode.LOADING);
    
    try {
      const newWords = await getWordsFromDatabase(category, settings.batchSize, customWords);
      setWords(newWords);
      setCurrentIndex(0);
      setIsEnglishRevealed(false);
      setIsPaused(false);
      setMode(AppMode.SESSION);
      playSound('pop');
    } catch (error) {
      console.error("Failed to load words", error);
      setMode(AppMode.WELCOME);
    }
  };

  const handleNextWord = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsEnglishRevealed(false);
      playSound('pop');
    } else {
      setMode(AppMode.SUMMARY);
      playSound('success');
    }
  }, [currentIndex, words]);

  const handlePreviousWord = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsEnglishRevealed(false);
      playSound('pop');
    }
  }, [currentIndex]);

  const togglePause = () => setIsPaused(prev => !prev);

  const adjustAutoDelay = (amount: number) => {
    setSettings(prev => ({
      ...prev,
      autoAdvanceDelay: Math.max(1, Math.min(10, prev.autoAdvanceDelay + amount))
    }));
  };

  const recordStudy = useCallback((wordId: string) => {
    const newCount = incrementReviewCount(wordId);
    setWords(prev => prev.map(w => w.id === wordId ? { ...w, reviewCount: newCount } : w));
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);

    if (mode === AppMode.SESSION && !isPaused && words.length > 0) {
      const currentWord = words[currentIndex];

      if (!isEnglishRevealed) {
        tickIntervalRef.current = setInterval(() => {
          playSound('tick');
        }, 1000);

        timerRef.current = setTimeout(() => {
          setIsEnglishRevealed(true);
          speakEnglish(currentWord.english);
          recordStudy(currentWord.id);
          if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        }, settings.revealDelay * 1000);
      } else {
        timerRef.current = setTimeout(() => {
          handleNextWord();
        }, settings.autoAdvanceDelay * 1000);
      }
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [mode, currentIndex, isEnglishRevealed, isPaused, settings, handleNextWord, words, recordStudy]);

  const handleCustomSubmit = () => {
    try {
      const parsed = JSON.parse(customInput);
      if (!Array.isArray(parsed)) throw new Error("Must be an array");
      const formatted: WordItem[] = parsed.map((item, i) => ({
        id: `custom-${item.english?.toLowerCase().replace(/\s+/g, '-') || Date.now()}`,
        korean: item.korean || 'N/A',
        english: item.english || 'N/A',
        partOfSpeech: item.partOfSpeech || 'unknown',
        example: item.example || '',
        reviewCount: 0
      }));
      handleStartSession(Category.CUSTOM, formatted);
    } catch (e) {
      alert("Invalid JSON format. Please follow the instructions.");
    }
  };

  if (mode === AppMode.WELCOME) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-4xl text-center space-y-10">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
              Lingo<span className="text-indigo-600">Focus</span>
            </h1>
            <p className="text-slate-400 text-lg font-semibold tracking-tight">Smart Vocabulary Trainer</p>
          </div>

          {/* 가로형 슬림 메뉴 */}
          <div className="flex flex-row gap-4 w-full justify-center">
            <HomeCard 
              icon={<BookOpen size={24} />} 
              title="OPIc" 
              desc="Natural Speaking"
              color="orange"
              onClick={() => handleStartSession(Category.OPIC)}
            />
            <HomeCard 
              icon={<Brain size={24} />} 
              title="AI & Tech" 
              desc="Professional R&D"
              color="blue"
              onClick={() => handleStartSession(Category.AI_ENGINEERING)}
            />
            <HomeCard 
              icon={<Sparkles size={24} />} 
              title="Custom" 
              desc="Gemini Powered"
              color="indigo"
              onClick={() => setMode(AppMode.CUSTOM_INPUT)}
            />
          </div>

          <div className="flex justify-center gap-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Volume2 size={14} /> TTS</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> Interval</span>
            <span className="flex items-center gap-1.5"><Repeat size={14} /> Progress</span>
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><Settings size={14} /> Settings</button>
          </div>
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

  if (mode === AppMode.CUSTOM_INPUT) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-12 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex items-center justify-between border-b pb-6">
            <button onClick={() => setMode(AppMode.WELCOME)} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors font-bold uppercase text-sm">
              <ChevronLeft size={20} /> Back
            </button>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Topic Generator</h2>
          </header>

          <div className="grid md:grid-cols-2 gap-8">
            <section className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2 text-indigo-400"><Sparkles size={16} /> Step 1: Prompt</h3>
                <button 
                  onClick={() => { navigator.clipboard.writeText("Prompt template here..."); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  {copied ? <ClipboardCheck size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">Copy the prompt and use it in Gemini to get custom words.</p>
              <div className="bg-black/30 p-4 rounded-xl font-mono text-[11px] text-indigo-200 border border-white/5 whitespace-pre-wrap">
                Please generate a JSON array of 20 English vocabulary words for [TOPIC]. Keys: "korean", "english", "partOfSpeech", "example".
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px]">2</div> Paste JSON</h3>
              <textarea 
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="[ { 'korean': '...', 'english': '...', ... } ]"
                className="w-full h-[220px] p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-mono text-xs"
              />
              <Button fullWidth onClick={handleCustomSubmit} disabled={!customInput.trim()} className="py-4">
                Start Session
              </Button>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (mode === AppMode.LOADING) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div><h2 className="text-lg font-black text-slate-800">LOADING WORDS...</h2></div>;

  if (mode === AppMode.SUMMARY) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-600 p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600"><CheckCircle2 size={32} /></div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">SESSION DONE</h2>
        <div className="flex flex-col gap-2">
          <Button onClick={() => handleStartSession(settings.category)}>Restart</Button>
          <Button variant="secondary" onClick={() => setMode(AppMode.WELCOME)}>Home</Button>
        </div>
      </div>
    </div>
  );

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col select-none overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => setMode(AppMode.WELCOME)} className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">LF</div>
          <span className="font-black text-lg text-slate-800 tracking-tighter">LingoFocus</span>
        </button>
        <div className="flex-1 max-w-md mx-6">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className="h-full bg-indigo-600 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-1 font-bold uppercase tracking-widest">{currentIndex + 1} / {words.length}</p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><Settings size={20} /></button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div key={currentIndex} className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden min-h-[480px] flex flex-col relative animate-in fade-in slide-in-from-bottom-4 transition-all border border-slate-50">
            <div className="h-2 bg-indigo-500 w-full" />
            
            <div className="px-8 py-4 flex justify-between items-center border-b border-slate-100">
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{currentWord?.partOfSpeech}</span>
              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                <Repeat size={12} strokeWidth={3} />
                <span className="text-xs font-black">{currentWord?.reviewCount || 0}</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="space-y-4 mb-8">
                <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Meaning</span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">{currentWord?.korean}</h2>
              </div>

              {isEnglishRevealed ? (
                <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
                  <div className="space-y-2">
                    <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"><Volume2 size={12} /> Word</span>
                    <h3 className="text-3xl md:text-4xl font-black text-indigo-600 tracking-tight">{currentWord?.english}</h3>
                  </div>
                  {currentWord?.example && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-w-md mx-auto">
                      <p className="text-slate-600 text-sm font-medium italic">"{currentWord.example}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                  <button onClick={() => adjustAutoDelay(-1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><Minus size={16} /></button>
                  <span className="text-sm font-black text-slate-800 min-w-[2rem] text-center">{settings.autoAdvanceDelay}s</span>
                  <button onClick={() => adjustAutoDelay(1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><Plus size={16} /></button>
                </div>
                <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-slate-300' : isEnglishRevealed ? 'bg-teal-500 animate-pulse' : 'bg-indigo-600 animate-pulse'}`} />
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{isPaused ? 'Paused' : isEnglishRevealed ? 'Next soon' : 'Thinking'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <Button onClick={handlePreviousWord} disabled={currentIndex === 0} variant="secondary" className="px-6 py-3 rounded-2xl"><ChevronLeft size={24} /></Button>
                <Button onClick={togglePause} variant={isPaused ? "primary" : "outline"} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black uppercase">
                  {isPaused ? <><Play size={18} fill="currentColor" /> Resume</> : <><Pause size={18} fill="currentColor" /> Pause</>}
                </Button>
                <Button onClick={handleNextWord} className="px-6 py-3 rounded-2xl"><ChevronRight size={24} /></Button>
              </div>
            </div>

            {!isPaused && words.length > 0 && (
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

const HomeCard = ({ icon, title, desc, color, onClick }: any) => {
  const themes: any = {
    orange: "bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-500 hover:bg-orange-100 shadow-orange-100/20",
    blue: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-500 hover:bg-blue-100 shadow-blue-100/20",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-100 shadow-indigo-100/20"
  };
  return (
    <div onClick={onClick} className={`group cursor-pointer p-6 rounded-3xl shadow-sm transition-all border-2 flex flex-col items-center text-center space-y-3 flex-1 min-w-0 ${themes[color]} transform hover:-translate-y-1`}>
      <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform group-hover:rotate-3">{icon}</div>
      <div className="space-y-0.5">
        <h3 className="text-base font-black tracking-tight uppercase leading-tight">{title}</h3>
        <p className="text-slate-500 text-[10px] font-bold leading-tight opacity-70 truncate">{desc}</p>
      </div>
      <div className="pt-1"><span className="px-4 py-1.5 bg-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-xs group-hover:bg-slate-900 group-hover:text-white transition-all">Start &rarr;</span></div>
    </div>
  );
};

export default App;
