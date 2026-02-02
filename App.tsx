
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Play, Pause, BookOpen, Brain, ChevronRight, ChevronLeft, CheckCircle2, Home, Clock, Plus, Minus, Repeat, Sparkles, Copy, ClipboardCheck, Volume2, Languages, PlusCircle, Trash2, Calendar, Database } from 'lucide-react';
import { AppMode, Category, SessionSettings, WordItem, WordSet } from './types';
import { getAllSets, getSetsByCategory, saveNewSet, deleteSet, incrementReviewCount, getStoredReviewCount } from './services/storageService';
import { playSound, speakEnglish } from './services/audioService';
import { generateWordSet } from './services/geminiService';
import { Button } from './components/Button';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.WELCOME);
  const [activeCategory, setActiveCategory] = useState<Category>(Category.OPIC);
  const [availableSets, setAvailableSets] = useState<WordSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<WordSet | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEnglishRevealed, setIsEnglishRevealed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SessionSettings>({
    category: Category.OPIC,
    revealDelay: 3,
    autoAdvanceDelay: 3,
    batchSize: 50
  });

  // Generator State
  const [genCategory, setGenCategory] = useState<Category>(Category.OPIC);
  const [genTopic, setGenTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const timerRef = useRef<any>(null);
  const tickIntervalRef = useRef<any>(null);

  const loadCategorySets = (cat: Category) => {
    setActiveCategory(cat);
    setAvailableSets(getSetsByCategory(cat));
    setMode(AppMode.SET_LIST);
  };

  const handleStartSession = (set: WordSet) => {
    setSelectedSet(set);
    // Shuffle and inject review counts
    const preparedWords = [...set.words].map(w => ({
      ...w,
      reviewCount: getStoredReviewCount(w.id)
    }));
    
    // Simple shuffle
    for (let i = preparedWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [preparedWords[i], preparedWords[j]] = [preparedWords[j], preparedWords[i]];
    }

    setWords(preparedWords.slice(0, settings.batchSize));
    setCurrentIndex(0);
    setIsEnglishRevealed(false);
    setIsPaused(false);
    setMode(AppMode.SESSION);
    playSound('pop');
  };

  const handleGenerate = async () => {
    if (!genTopic.trim()) return;
    setIsGenerating(true);
    setMode(AppMode.LOADING);
    try {
      const newSet = await generateWordSet(genCategory, genTopic);
      saveNewSet(newSet);
      setIsGenerating(false);
      loadCategorySets(genCategory);
      setGenTopic('');
      playSound('success');
    } catch (error) {
      alert("Generation failed. Please check your API key.");
      setMode(AppMode.GENERATOR);
      setIsGenerating(false);
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

  const renderKorean = (text: string) => {
    if (selectedSet?.category === Category.SUBJECT_VERB && text.includes('/')) {
      return (
        <div className="flex flex-wrap justify-center gap-2">
          {text.split('/').map((part, i) => (
            <span key={i} className="text-slate-900">{part.trim()}{i < text.split('/').length - 1 && <span className="text-slate-300 ml-2">/</span>}</span>
          ))}
        </div>
      );
    }
    return text;
  };

  if (mode === AppMode.WELCOME) {
    const allSets = getAllSets();
    const counts = {
      [Category.OPIC]: allSets.filter(s => s.category === Category.OPIC).reduce((acc, s) => acc + s.words.length, 0),
      [Category.AI_ENGINEERING]: allSets.filter(s => s.category === Category.AI_ENGINEERING).reduce((acc, s) => acc + s.words.length, 0),
      [Category.SUBJECT_VERB]: allSets.filter(s => s.category === Category.SUBJECT_VERB).reduce((acc, s) => acc + s.words.length, 0)
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
              Lingo<span className="text-indigo-600">Focus</span>
            </h1>
            <p className="text-slate-400 text-sm font-semibold tracking-tight">AI Powered Memory Training</p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <HomeCard 
              icon={<Languages size={18} />} 
              title="S+V Pattern" 
              desc={`${counts[Category.SUBJECT_VERB]} words in DB`}
              color="indigo"
              onClick={() => loadCategorySets(Category.SUBJECT_VERB)}
            />
            <HomeCard 
              icon={<BookOpen size={18} />} 
              title="OPIc Training" 
              desc={`${counts[Category.OPIC]} words in DB`}
              color="orange"
              onClick={() => loadCategorySets(Category.OPIC)}
            />
            <HomeCard 
              icon={<Brain size={18} />} 
              title="AI Tech Vocab" 
              desc={`${counts[Category.AI_ENGINEERING]} words in DB`}
              color="blue"
              onClick={() => loadCategorySets(Category.AI_ENGINEERING)}
            />
            <Button onClick={() => setMode(AppMode.GENERATOR)} variant="secondary" className="flex items-center justify-center gap-2 py-4 rounded-2xl border-dashed border-2 bg-transparent text-indigo-600 border-indigo-200 hover:border-indigo-600">
              <PlusCircle size={20} /> Create New 학습 세트 (AI)
            </Button>
          </div>

          <div className="flex justify-center gap-6 text-slate-400 font-bold text-[9px] uppercase tracking-widest pt-4">
             <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><Settings size={12} /> Preferences</button>
          </div>
        </div>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} delay={settings.revealDelay} setDelay={(d) => setSettings(s => ({...s, revealDelay: d}))} autoAdvanceDelay={settings.autoAdvanceDelay} setAutoAdvanceDelay={(d) => setSettings(s => ({...s, autoAdvanceDelay: d}))} batchSize={settings.batchSize} setBatchSize={(b) => setSettings(s => ({...s, batchSize: b}))} />
      </div>
    );
  }

  if (mode === AppMode.SET_LIST) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-10 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-8">
          <header className="flex items-center justify-between border-b pb-6">
            <button onClick={() => setMode(AppMode.WELCOME)} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black uppercase text-xs">
              <ChevronLeft size={18} /> Back
            </button>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{activeCategory} Database</h2>
          </header>

          <div className="grid gap-4">
            {availableSets.map(set => (
              <div key={set.id} className="group p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:border-indigo-500 hover:bg-white transition-all shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => handleStartSession(set)}>
                   <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                      <Database size={20} />
                   </div>
                   <div className="flex-1">
                      <h4 className="text-base font-black text-slate-800 leading-tight">{set.topic}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(set.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><PlusCircle size={10} /> {set.words.length} Words</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button onClick={() => handleStartSession(set)} variant="primary" className="py-2 px-4 text-xs font-black">START</Button>
                   {!set.id.startsWith('seed') && (
                     <button onClick={() => { deleteSet(set.id); setAvailableSets(prev => prev.filter(s => s.id !== set.id)); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                       <Trash2 size={18} />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === AppMode.GENERATOR) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white p-10 rounded-[3rem] shadow-2xl space-y-8">
           <header className="text-center space-y-2">
             <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <Sparkles size={32} />
             </div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tighter">AI Set Generator</h2>
             <p className="text-slate-400 text-sm font-medium">Gemini will build a custom JSON database for you.</p>
           </header>

           <div className="space-y-6">
             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Category</label>
               <div className="grid grid-cols-3 gap-2">
                 {[Category.OPIC, Category.AI_ENGINEERING, Category.SUBJECT_VERB].map(cat => (
                   <button 
                     key={cat}
                     onClick={() => setGenCategory(cat)}
                     className={`py-3 px-2 rounded-xl text-[10px] font-black transition-all border-2 ${genCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                   >
                     {cat === Category.SUBJECT_VERB ? "S+V Pattern" : cat === Category.OPIC ? "OPIc" : "AI Tech"}
                   </button>
                 ))}
               </div>
             </div>

             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">What do you want to learn?</label>
               <input 
                 type="text"
                 value={genTopic}
                 onChange={(e) => setGenTopic(e.target.value)}
                 placeholder="e.g. Hiking, Coffee, Cloud Infrastructure..."
                 className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold"
               />
             </div>

             <div className="flex gap-3">
               <Button onClick={() => setMode(AppMode.WELCOME)} variant="secondary" className="flex-1 py-4">Cancel</Button>
               <Button onClick={handleGenerate} disabled={!genTopic.trim()} className="flex-[2] py-4 shadow-indigo-200 shadow-xl">Generate DB &rarr;</Button>
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (mode === AppMode.LOADING) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-16 h-16 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
      <h2 className="text-lg font-black text-slate-800 tracking-widest uppercase animate-pulse">AI is crafting your database...</h2>
    </div>
  );

  if (mode === AppMode.SUMMARY) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-600 p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600"><CheckCircle2 size={40} /></div>
        <div className="space-y-1">
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">MISSION COMPLETE</h2>
           <p className="text-slate-400 text-sm font-bold uppercase tracking-wide">You mastered {words.length} expressions</p>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={() => handleStartSession(selectedSet!)} className="py-5 text-lg">RESTART SET</Button>
          <Button variant="secondary" onClick={() => setMode(AppMode.WELCOME)} className="py-5 text-lg">BACK TO MENU</Button>
        </div>
      </div>
    </div>
  );

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col select-none overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => setMode(AppMode.WELCOME)} className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm">LF</div>
          <div className="text-left">
             <span className="font-black text-lg text-slate-800 tracking-tighter block leading-none">LingoFocus</span>
             <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{selectedSet?.topic}</span>
          </div>
        </button>
        <div className="flex-1 max-w-md mx-6">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-1.5 font-bold uppercase tracking-widest">{currentIndex + 1} / {words.length}</p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500"><Settings size={20} /></button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div key={currentIndex} className="bg-white rounded-[3rem] shadow-2xl overflow-hidden min-h-[500px] flex flex-col relative animate-in fade-in slide-in-from-bottom-4">
            <div className="px-8 py-6 flex justify-between items-center bg-slate-50/40 border-b border-slate-50">
              <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{currentWord?.partOfSpeech}</span>
              <div className="flex items-center gap-2 text-indigo-600 bg-white px-4 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                <Repeat size={14} strokeWidth={3} />
                <span className="text-xs font-black">{currentWord?.reviewCount || 0} Mastery</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="space-y-6 mb-12 w-full">
                <span className="text-slate-300 text-xs font-black uppercase tracking-widest">
                  {selectedSet?.category === Category.SUBJECT_VERB ? "Think in English Order" : "Concept"}
                </span>
                <div className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  {renderKorean(currentWord?.korean || "")}
                </div>
              </div>

              {isEnglishRevealed ? (
                <div className="space-y-8 animate-in fade-in zoom-in duration-500 w-full">
                  <div className="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
                  <div className="space-y-3">
                    <span className="text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"><Volume2 size={16} /> Expression</span>
                    <h3 className="text-3xl md:text-4xl font-black text-indigo-700 tracking-tight leading-none">{currentWord?.english}</h3>
                  </div>
                  {currentWord?.example && (
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 max-w-sm mx-auto shadow-inner">
                      <p className="text-slate-600 text-sm font-medium italic">"{currentWord.example}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center gap-3">
                  <div className="w-3 h-3 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-3 h-3 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>

            <div className="bg-slate-50/80 p-8 border-t border-slate-100 space-y-8 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
                  <button onClick={() => setSettings(s => ({...s, autoAdvanceDelay: Math.max(1, s.autoAdvanceDelay - 1)}))} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><Minus size={18} /></button>
                  <span className="text-base font-black text-slate-800 min-w-[2.5rem] text-center">{settings.autoAdvanceDelay}s</span>
                  <button onClick={() => setSettings(s => ({...s, autoAdvanceDelay: Math.min(10, s.autoAdvanceDelay + 1)}))} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><Plus size={18} /></button>
                </div>
                <div className="px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-slate-300' : isEnglishRevealed ? 'bg-teal-500 animate-pulse shadow-sm shadow-teal-300' : 'bg-indigo-600 animate-pulse shadow-sm shadow-indigo-300'}`} />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{isPaused ? 'Paused' : isEnglishRevealed ? 'Auto-Next' : 'Thinking'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-5">
                <Button onClick={handlePreviousWord} disabled={currentIndex === 0} variant="secondary" className="px-8 py-4 rounded-[1.5rem]"><ChevronLeft size={28} /></Button>
                <Button onClick={() => setIsPaused(!isPaused)} variant={isPaused ? "primary" : "outline"} className="flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest">
                  {isPaused ? <><Play size={24} fill="currentColor" /> Resume</> : <><Pause size={24} fill="currentColor" /> Pause</>}
                </Button>
                <Button onClick={handleNextWord} className="px-8 py-4 rounded-[1.5rem]"><ChevronRight size={28} /></Button>
              </div>
            </div>

            {!isPaused && (
              <div key={`timer-${currentIndex}-${isEnglishRevealed}`} className={`absolute bottom-0 left-0 h-2 transition-all ease-linear ${isEnglishRevealed ? 'bg-teal-500' : 'bg-indigo-600'}`}
                 style={{ width: '100%', transitionDuration: isEnglishRevealed ? `${settings.autoAdvanceDelay}s` : `${settings.revealDelay}s` }} />
            )}
          </div>
        </div>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} delay={settings.revealDelay} setDelay={(d) => setSettings(s => ({...s, revealDelay: d}))} autoAdvanceDelay={settings.autoAdvanceDelay} setAutoAdvanceDelay={(d) => setSettings(s => ({...s, autoAdvanceDelay: d}))} batchSize={settings.batchSize} setBatchSize={(b) => setSettings(s => ({...s, batchSize: b}))} />
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
    <div onClick={onClick} className={`group cursor-pointer p-5 rounded-3xl shadow-sm transition-all border-2 flex items-center text-left gap-5 w-full ${themes[color]} transform active:scale-[0.98]`}>
      <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-black tracking-tight uppercase leading-none">{title}</h3>
        <p className="text-slate-500 text-xs font-bold leading-tight opacity-70 truncate mt-1.5">{desc}</p>
      </div>
      <div className="text-slate-300 group-hover:text-slate-900 transition-colors">
        <ChevronRight size={24} strokeWidth={3} />
      </div>
    </div>
  );
};

export default App;
