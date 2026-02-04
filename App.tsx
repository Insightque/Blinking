
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Play, Pause, BookOpen, Brain, ChevronRight, ChevronLeft, CheckCircle2, Home, Clock, Plus, Minus, Repeat, Sparkles, Copy, ClipboardCheck, Volume2, Languages, PlusCircle, Trash2, Calendar, Database, MessageSquare, ListMusic, X, Quote } from 'lucide-react';
import { AppMode, Category, SessionSettings, WordItem, WordSet, SentenceSet } from './types';
import { getAllSets, getSetsByCategory, saveNewSet, deleteSet, incrementReviewCount, getStoredReviewCount, getSentenceSetsByWordSetId, saveSentenceSet, deleteSentenceSet } from './services/storageService';
import { playSound, speakEnglish, speakKorean } from './services/audioService';
import { generateWordSet, generateSentenceSet } from './services/geminiService';
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
    batchSize: 50,
    readKoreanAloud: false
  });

  // Sentence Practice State
  const [sentencePickerSet, setSentencePickerSet] = useState<WordSet | null>(null);
  const [isSentencePickerOpen, setIsSentencePickerOpen] = useState(false);

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

  const handleStartSession = (set: WordSet | SentenceSet) => {
    if ('words' in set) {
       setSelectedSet(set as WordSet);
       const preparedWords = [...set.words].map(w => ({
         ...w,
         reviewCount: getStoredReviewCount(w.id)
       }));
       // Shuffle for words
       for (let i = preparedWords.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         [preparedWords[i], preparedWords[j]] = [preparedWords[j], preparedWords[i]];
       }
       setWords(preparedWords.slice(0, settings.batchSize));
    } else {
       // Sentence Practice
       setSelectedSet({ id: set.wordSetId, topic: `${set.topic} (Response Practice)` } as any);
       setWords(set.sentences.map(s => ({ ...s, reviewCount: getStoredReviewCount(s.id) })));
    }
    
    setCurrentIndex(0);
    setIsEnglishRevealed(false);
    setIsPaused(false);
    setMode(AppMode.SESSION);
    playSound('pop');
  };

  const handleGenSentences = async (set: WordSet) => {
    setMode(AppMode.LOADING);
    try {
      const sentenceSet = await generateSentenceSet(set);
      saveSentenceSet(sentenceSet);
      playSound('success');
      setMode(AppMode.SET_LIST);
      setSentencePickerSet(set);
      setIsSentencePickerOpen(true);
    } catch (error) {
      alert("Sentence generation failed.");
      setMode(AppMode.SET_LIST);
    }
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
        // 처음 한글 제시 시 읽어주기 (옵션이 켜져있을 때)
        if (settings.readKoreanAloud) {
          speakKorean(currentWord.korean);
        }

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
    if (text.includes('/')) {
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

  const handleDeleteSet = (setId: string, topic: string) => {
    if (confirm(`'${topic}' 세트를 정말 삭제하시겠습니까? 연결된 모든 문장 데이터도 삭제됩니다.`)) {
      deleteSet(setId);
      setAvailableSets(prev => prev.filter(s => s.id !== setId));
      playSound('pop');
    }
  };

  const handleDeleteSentenceSet = (id: string) => {
    if (confirm("이 문장 연습 세트를 삭제하시겠습니까?")) {
      deleteSentenceSet(id);
      playSound('pop');
    }
  };

  if (mode === AppMode.WELCOME) {
    const allSets = getAllSets();
    const counts = {
      [Category.OPIC]: allSets.filter(s => s.category === Category.OPIC).reduce((acc, s) => acc + s.words.length, 0),
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
            <Button onClick={() => setMode(AppMode.GENERATOR)} variant="secondary" className="flex items-center justify-center gap-2 py-4 rounded-2xl border-dashed border-2 bg-transparent text-indigo-600 border-indigo-200 hover:border-indigo-600 mt-2">
              <PlusCircle size={20} /> AI Custom Set Generation
            </Button>
          </div>

          <div className="flex justify-center gap-6 text-slate-400 font-bold text-[9px] uppercase tracking-widest pt-4">
             <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><Settings size={12} /> Global Preferences</button>
          </div>
        </div>
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          delay={settings.revealDelay} 
          setDelay={(d) => setSettings(s => ({...s, revealDelay: d}))} 
          autoAdvanceDelay={settings.autoAdvanceDelay} 
          setAutoAdvanceDelay={(d) => setSettings(s => ({...s, autoAdvanceDelay: d}))} 
          batchSize={settings.batchSize} 
          setBatchSize={(b) => setSettings(s => ({...s, batchSize: b}))} 
          readKoreanAloud={settings.readKoreanAloud} 
          setReadKoreanAloud={(v) => setSettings(s => ({...s, readKoreanAloud: v}))} 
        />
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
                <div className="flex items-center gap-2 ml-4">
                   <button 
                     title="Word Study"
                     onClick={() => handleStartSession(set)} 
                     className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-tight"
                   >
                     Study
                   </button>
                   <button 
                     title="Generate OPIc Answer Sentences"
                     onClick={() => handleGenSentences(set)}
                     className="p-2.5 bg-white text-teal-600 border border-teal-100 rounded-xl hover:bg-teal-50 transition-all group-hover:scale-110"
                   >
                     <Sparkles size={18} />
                   </button>
                   <button 
                     title="View Generated Response Sets"
                     onClick={() => { setSentencePickerSet(set); setIsSentencePickerOpen(true); }}
                     className="p-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all"
                   >
                     <MessageSquare size={18} />
                   </button>
                   {!set.id.startsWith('seed') && (
                     <button onClick={() => handleDeleteSet(set.id, set.topic)} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors">
                       <Trash2 size={18} />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isSentencePickerOpen && sentencePickerSet && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Response Sets</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select OPIc Answer Practice</p>
                 </div>
                 <button onClick={() => setIsSentencePickerOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20} /></button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {getSentenceSetsByWordSetId(sentencePickerSet.id).length > 0 ? (
                  getSentenceSetsByWordSetId(sentencePickerSet.id).map((ss) => (
                    <div key={ss.id} className="group p-5 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-teal-500 hover:bg-white transition-all flex items-center justify-between shadow-sm">
                      <div className="cursor-pointer flex-1" onClick={() => { handleStartSession(ss); setIsSentencePickerOpen(false); }}>
                        <div className="text-sm font-black text-slate-800 flex items-center gap-2">
                           <Quote size={14} className="text-teal-500" />
                           10 OPIc Responses (with fillers)
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{new Date(ss.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                         <button onClick={() => { handleStartSession(ss); setIsSentencePickerOpen(false); }} className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl"><Play size={18} fill="currentColor" /></button>
                         <button onClick={() => handleDeleteSentenceSet(ss.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-300">
                    <ListMusic size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">No response sets generated yet.</p>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => { handleGenSentences(sentencePickerSet); setIsSentencePickerOpen(false); }} 
                className="w-full mt-8 py-4 rounded-2xl flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 shadow-teal-100"
              >
                <Sparkles size={18} /> Generate New Response Set
              </Button>
            </div>
          </div>
        )}

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} delay={settings.revealDelay} setDelay={(d) => setSettings(s => ({...s, revealDelay: d}))} autoAdvanceDelay={settings.autoAdvanceDelay} setAutoAdvanceDelay={(d) => setSettings(s => ({...s, autoAdvanceDelay: d}))} batchSize={settings.batchSize} setBatchSize={(b) => setSettings(s => ({...s, batchSize: b}))} readKoreanAloud={settings.readKoreanAloud} setReadKoreanAloud={(v) => setSettings(s => ({...s, readKoreanAloud: v}))} />
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
               <div className="grid grid-cols-2 gap-2">
                 {[Category.OPIC, Category.SUBJECT_VERB].map(cat => (
                   <button 
                     key={cat}
                     onClick={() => setGenCategory(cat)}
                     className={`py-4 px-2 rounded-2xl text-[10px] font-black transition-all border-2 ${genCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200 hover:bg-white'}`}
                   >
                     {cat === Category.SUBJECT_VERB ? "S+V Pattern" : "OPIc Speaking"}
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
                 placeholder="e.g. My neighbors, Daily routine, Work tasks..."
                 className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-lg"
               />
             </div>

             <div className="flex gap-4 pt-4">
               <Button onClick={() => setMode(AppMode.WELCOME)} variant="secondary" className="flex-1 py-5 rounded-2xl">Cancel</Button>
               <Button onClick={handleGenerate} disabled={!genTopic.trim()} className="flex-[2] py-5 rounded-2xl shadow-indigo-200 shadow-2xl text-lg font-black">Generate Patterns &rarr;</Button>
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
      <h2 className="text-2xl font-black text-slate-900 tracking-tighter mt-10 mb-2 uppercase animate-pulse">Processing with AI</h2>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Crafting high-quality patterns for you</p>
    </div>
  );

  if (mode === AppMode.SUMMARY) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-600 p-6">
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl max-w-sm w-full text-center space-y-8">
        <div className="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center mx-auto text-green-600 border-4 border-white shadow-xl rotate-3"><CheckCircle2 size={48} /></div>
        <div className="space-y-2">
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">WELL DONE!</h2>
           <p className="text-slate-400 text-xs font-black uppercase tracking-[0.15em] border-y py-2 border-slate-100">{selectedSet?.topic}</p>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={() => setMode(AppMode.SESSION)} className="py-5 text-xl rounded-2xl font-black">RESTART SESSION</Button>
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
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { if(confirm("학습을 종료하고 목록으로 돌아가시겠습니까?")) setMode(AppMode.SET_LIST); }} 
            className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 transition-all"
            title="Exit Session"
          >
            <X size={20} strokeWidth={3} />
          </button>
          <div className="text-left hidden sm:block">
             <span className="font-black text-xl text-slate-800 tracking-tighter block leading-none">LingoFocus</span>
             <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate max-w-[180px]">{selectedSet?.topic}</span>
          </div>
        </div>
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
                  {currentWord?.partOfSpeech === 'sentence' || currentWord?.partOfSpeech === 'OPIc Response' || currentWord?.partOfSpeech === 'pattern' ? "Memorize Response Pattern" : "Recall Meaning"}
                </span>
                <div className={`font-black text-slate-900 tracking-tight leading-tight ${currentWord?.korean.length > 50 ? 'text-xl md:text-2xl' : 'text-3xl md:text-5xl'}`}>
                  {renderKorean(currentWord?.korean || "")}
                </div>
              </div>

              {isEnglishRevealed ? (
                <div className="space-y-10 animate-in fade-in zoom-in duration-500 w-full">
                  <div className="w-24 h-2 bg-indigo-600 mx-auto rounded-full shadow-sm"></div>
                  <div className="space-y-4">
                    <span className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"><Volume2 size={20} /> Targeted Response</span>
                    <h3 className={`font-black text-indigo-700 tracking-tighter leading-tight ${currentWord?.english.length > 80 ? 'text-lg md:text-xl' : currentWord?.english.length > 40 ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'}`}>
                      {currentWord?.english}
                    </h3>
                  </div>
                  {currentWord?.example && !['sentence', 'OPIc Response', 'pattern'].includes(currentWord.partOfSpeech) && (
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
                  <span className="text-xs text-slate-400 font-black uppercase tracking-widest">{isPaused ? 'Paused' : isEnglishRevealed ? 'Next Soon' : 'Recalling'}</span>
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

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} delay={settings.revealDelay} setDelay={(d) => setSettings(s => ({...s, revealDelay: d}))} autoAdvanceDelay={settings.autoAdvanceDelay} setAutoAdvanceDelay={(d) => setSettings(s => ({...s, autoAdvanceDelay: d}))} batchSize={settings.batchSize} setBatchSize={(b) => setSettings(s => ({...s, batchSize: b}))} readKoreanAloud={settings.readKoreanAloud} setReadKoreanAloud={(v) => setSettings(s => ({...s, readKoreanAloud: v}))} />
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
