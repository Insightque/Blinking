
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
    // Prepare words: inject review counts
    const preparedWords = [...set.words].map(w => ({
      ...w,
      reviewCount: getStoredReviewCount(w.id)
    }));
    
    // Shuffle
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
      alert("Generation failed. Please check your connection.");
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
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2">
          {text.split('/').map((part, i, arr) => (
            <React.Fragment key={i}>
              <span className="text-slate-900 font-black">{part.trim()}</span>
              {i < arr.length - 1 && <span className="text-indigo-200 font-thin text-3xl">/</span>}
            </React.Fragment>
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
            <p className="text-slate-400 text-sm font-semibold tracking-tight">Professional Memory Trainer</p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <HomeCard 
              icon={<Languages size={18} />} 
              title="S+V Pattern Practice" 
              desc={`${counts[Category.SUBJECT_VERB]} patterns across sets`}
              color="indigo"
              onClick={() => loadCategorySets(Category.SUBJECT_VERB)}
            />
            <HomeCard 
              icon={<BookOpen size={18} />} 
              title="OPIc Preparation" 
              desc={`${counts[Category.OPIC]} phrases across sets`}
              color="orange"
              onClick={() => loadCategorySets(Category.OPIC)}
            />
            <HomeCard 
              icon={<Brain size={18} />} 
              title="AI Engineering Vocab" 
              desc={`${counts[Category.AI_ENGINEERING]} terms across sets`}
              color="blue"
              onClick={() => loadCategorySets(Category.AI_ENGINEERING)}
            />
            <Button onClick={() => setMode(AppMode.GENERATOR)} variant="secondary" className="flex items-center justify-center gap-2 py-4 rounded-2xl border-dashed border-2 bg-transparent text-indigo-600 border-indigo-200 hover:border-indigo-600 mt-2">
              <PlusCircle size={20} /> AI Custom Set Generation
            </Button>
          </div>

          <div className="flex justify-center gap-6 text-slate-400 font-bold text-[9px] uppercase tracking-widest pt-4">
             <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><Settings size={12} /> Global Preferences</button>
          </div>
        </div>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} delay={settings.revealDelay} setDelay={(d) => setSettings(s => ({...s, revealDelay: d}))} autoAdvanceDelay={settings.autoAdvanceDelay} setAutoAdvanceDelay={(d) => setSettings(s => ({...s, autoAdvanceDelay: d}))} batchSize={settings.batchSize} setBatchSize={(b) => setSettings(s => ({...s, batchSize: b}))} />
      </div>
    );
  }

  if (mode === AppMode.SET_LIST) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-10 flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-2xl space-y-8">
          <header className="flex items-center justify-between border-b pb-6">
            <button onClick={() => setMode(AppMode.WELCOME)} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black uppercase text-xs">
              <ChevronLeft size={18} /> Back to Categories
            </button>
            <div className="text-right">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{activeCategory} Collections</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{availableSets.length} Topics Available</p>
            </div>
          </header>

          <div className="grid gap-4">
            {availableSets.map(set => (
              <div key={set.id} className="group p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-indigo-500 hover:bg-white transition-all shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-5 cursor-pointer flex-1" onClick={() => handleStartSession(set)}>
                   <div className={`p-4 rounded-2xl shadow-sm ${set.id.startsWith('seed') ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-50'}`}>
                      <Database size={22} />
                   </div>
                   <div className="flex-1">
                      <h4 className="text-lg font-black text-slate-800 leading-tight">{set.topic}</h4>
                      <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(set.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1 font-black text-indigo-500"><PlusCircle size={12} /> {set.words.length} Expressions</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <Button onClick={() => handleStartSession(set)} variant="primary" className="py-2.5 px-6 text-xs font-black rounded-xl">STUDY</Button>
                   {!set.id.startsWith('seed') && (
                     <button onClick={() => { deleteSet(set.id); setAvailableSets(prev => prev.filter(s => s.id !== set.id)); }} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors">
                       <Trash2 size={20} />
                     </button>
                   )}
                </div>
              </div>
            ))}
            {availableSets.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No custom sets found in this category.</p>
                <Button onClick={() => setMode(AppMode.GENERATOR)} variant="outline" className="mt-6">Generate New Set</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === AppMode.GENERATOR) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white p-10 rounded-[3rem] shadow-2xl space-y-10 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
           
           <header className="text-center space-y-3">
             <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-indigo-100">
               <Sparkles size={40} />
             </div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tighter">AI Topic Creator</h2>
             <p className="text-slate-400 text-sm font-bold uppercase tracking-wide">Generate specialized training data</p>
           </header>

           <div className="space-y-8">
             <div className="space-y-4">
               <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">1. Choose Category</label>
               <div className="grid grid-cols-3 gap-2">
                 {[Category.OPIC, Category.AI_ENGINEERING, Category.SUBJECT_VERB].map(cat => (
                   <button 
                     key={cat}
                     onClick={() => setGenCategory(cat)}
                     className={`py-4 px-2 rounded-2xl text-[10px] font-black transition-all border-2 ${genCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200 hover:bg-white'}`}
                   >
                     {cat === Category.SUBJECT_VERB ? "S+V Pattern" : cat === Category.OPIC ? "OPIc Speaking" : "AI Technology"}
                   </button>
                 ))}
               </div>
             </div>

             <div className="space-y-4">
               <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">2. Enter Specific Topic</label>
               <input 
                 type="text"
                 value={genTopic}
                 onChange={(e) => setGenTopic(e.target.value)}
                 placeholder="e.g. My neighbors, Cloud migration, Python debugging..."
                 className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-lg"
               />
               <p className="text-[10px] text-slate-400 font-medium px-1">Gemini will generate 30 high-quality expressions for this topic.</p>
             </div>

             <div className="flex gap-4 pt-4">
               <Button onClick={() => setMode(AppMode.WELCOME)} variant="secondary" className="flex-1 py-5 rounded-2xl">Cancel</Button>
               <Button onClick={handleGenerate} disabled={!genTopic.trim()} className="flex-[2] py-5 rounded-2xl shadow-indigo-200 shadow-2xl text-lg font-black">Generate JSON &rarr;</Button>
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (mode === AppMode.LOADING) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
      <div className="relative">
        <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
           <Brain size={32} />
        </div>
      </div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tighter mt-10 mb-2 uppercase animate-pulse">Processing JSON Generation</h2>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Crafting professional datasets with Gemini Flash</p>
    </div>
  );

  if (mode === AppMode.SUMMARY) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-600 p-6">
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl max-w-sm w-full text-center space-y-8">
        <div className="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center mx-auto text-green-600 border-4 border-white shadow-xl rotate-3"><CheckCircle2 size={48} /></div>
        <div className="space-y-2">
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">SUCCESS!</h2>
           <p className="text-slate-400 text-xs font-black uppercase tracking-[0.15em] border-y py-2 border-slate-100">{selectedSet?.topic}</p>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={() => handleStartSession(selectedSet!)} className="py-5 text-xl rounded-2xl font-black">RESTART SET</Button>
          <Button variant="secondary" onClick={() => setMode(AppMode.SET_LIST)} className="py-5 text-lg rounded-2xl font-bold">TOPIC SELECTION</Button>
        </div>
      </div>
    </div>
  );

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col select-none overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => setMode(AppMode.WELCOME)} className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">LF</div>
          <div className="text-left hidden sm:block">
             <span className="font-black text-xl text-slate-800 tracking-tighter block leading-none">LingoFocus</span>
             <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate max-w-[180px]">{selectedSet?.topic}</span>
          </div>
        </button>
        <div className="flex-1 max-w-md mx-4 md:mx-10">
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-center text-slate-400 mt-2 font-black uppercase tracking-[0.2em]">{currentIndex + 1} / {words.length}</p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-500 border border-transparent hover:border-slate-100 transition-all"><Settings size={22} /></button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div key={currentIndex} className="bg-white rounded-[4rem] shadow-2xl overflow-hidden min-h-[550px] flex flex-col relative animate-in fade-in slide-in-from-bottom-4 border-b-8 border-indigo-600">
            <div className="px-10 py-8 flex justify-between items-center bg-slate-50/40 border-b border-slate-50">
              <span className="px-5 py-2 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-lg shadow-indigo-100">{currentWord?.partOfSpeech}</span>
              <div className="flex items-center gap-3 text-indigo-600 bg-white px-5 py-2 rounded-2xl border border-indigo-50 shadow-sm">
                <Repeat size={16} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-wider">{currentWord?.reviewCount || 0} Mastery</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-10 md:p-14 text-center">
              <div className="space-y-8 mb-16 w-full">
                <span className="text-slate-300 text-xs font-black uppercase tracking-[0.3em]">
                  {selectedSet?.category === Category.SUBJECT_VERB ? "Conceptualize Phrase" : "Definition"}
                </span>
                <div className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                  {renderKorean(currentWord?.korean || "")}
                </div>
              </div>

              {isEnglishRevealed ? (
                <div className="space-y-10 animate-in fade-in zoom-in duration-500 w-full">
                  <div className="w-24 h-2 bg-indigo-600 mx-auto rounded-full shadow-sm"></div>
                  <div className="space-y-4">
                    <span className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"><Volume2 size={20} /> Professional Expression</span>
                    <h3 className="text-4xl md:text-5xl font-black text-indigo-700 tracking-tighter leading-none">{currentWord?.english}</h3>
                  </div>
                  {currentWord?.example && (
                    <div className="bg-slate-50/80 p-8 rounded-[2.5rem] border border-slate-100 max-w-md mx-auto shadow-inner">
                      <p className="text-slate-600 text-base font-medium italic leading-relaxed">"{currentWord.example}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center gap-4">
                  <div className="w-4 h-4 bg-indigo-100 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-4 h-4 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-4 h-4 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>

            <div className="bg-slate-50/90 p-10 border-t border-slate-100 space-y-10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                  <button onClick={() => setSettings(s => ({...s, autoAdvanceDelay: Math.max(1, s.autoAdvanceDelay - 1)}))} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><Minus size={20} /></button>
                  <span className="text-xl font-black text-slate-800 min-w-[3rem] text-center tabular-nums">{settings.autoAdvanceDelay}s</span>
                  <button onClick={() => setSettings(s => ({...s, autoAdvanceDelay: Math.min(10, s.autoAdvanceDelay + 1)}))} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><Plus size={20} /></button>
                </div>
                <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isPaused ? 'bg-slate-300' : isEnglishRevealed ? 'bg-teal-500 animate-pulse shadow-sm shadow-teal-300' : 'bg-indigo-600 animate-pulse shadow-sm shadow-indigo-300'}`} />
                  <span className="text-xs text-slate-400 font-black uppercase tracking-widest">{isPaused ? 'Session Paused' : isEnglishRevealed ? 'Next Word Soon' : 'Mental Recall'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-6">
                <Button onClick={handlePreviousWord} disabled={currentIndex === 0} variant="secondary" className="px-10 py-5 rounded-[2rem]"><ChevronLeft size={32} /></Button>
                <Button onClick={() => setIsPaused(!isPaused)} variant={isPaused ? "primary" : "outline"} className="flex-1 flex items-center justify-center gap-4 py-5 rounded-[2rem] text-base font-black uppercase tracking-[0.2em] shadow-lg">
                  {isPaused ? <><Play size={28} fill="currentColor" /> Resume</> : <><Pause size={28} fill="currentColor" /> Pause</>}
                </Button>
                <Button onClick={handleNextWord} className="px-10 py-5 rounded-[2rem]"><ChevronRight size={32} /></Button>
              </div>
            </div>

            {!isPaused && (
              <div key={`timer-${currentIndex}-${isEnglishRevealed}`} className={`absolute bottom-0 left-0 h-2.5 transition-all ease-linear shadow-sm ${isEnglishRevealed ? 'bg-teal-500' : 'bg-indigo-600'}`}
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
    <div onClick={onClick} className={`group cursor-pointer p-6 rounded-[2.5rem] shadow-sm transition-all border-2 flex items-center text-left gap-6 w-full ${themes[color]} transform active:scale-[0.98]`}>
      <div className="p-5 bg-white rounded-3xl shadow-sm group-hover:scale-110 transition-transform border-b-2 border-slate-50">
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

export default App;
