
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Play, Pause, BookOpen, Brain, ChevronRight, ChevronLeft, CheckCircle2, Home, Clock, Plus, Minus, Repeat, Sparkles, Copy, ClipboardCheck } from 'lucide-react';
import { AppMode, Category, SessionSettings, WordItem } from './types';
import { getWordsFromDatabase } from './services/wordService';
import { incrementReviewCount } from './services/storageService';
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
    } catch (error) {
      console.error("Failed to load words", error);
      setMode(AppMode.WELCOME);
    }
  };

  const handleNextWord = useCallback(() => {
    // Increment review count for the word just learned
    const currentWord = words[currentIndex];
    if (currentWord) {
      incrementReviewCount(currentWord.id);
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsEnglishRevealed(false);
    } else {
      setMode(AppMode.SUMMARY);
    }
  }, [currentIndex, words]);

  const handlePreviousWord = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsEnglishRevealed(false);
    }
  }, [currentIndex]);

  const handleCustomSubmit = () => {
    try {
      const parsed = JSON.parse(customInput);
      if (!Array.isArray(parsed)) throw new Error("Must be an array");
      
      const formatted: WordItem[] = parsed.map((item, i) => ({
        id: `custom-${Date.now()}-${i}`,
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

  const PROMPT_TEMPLATE = `Please generate a list of 20 high-frequency English vocabulary words for the topic: [YOUR TOPIC HERE].
Provide the result strictly as a JSON array of objects with the following keys: "korean", "english", "partOfSpeech", "example".
The partOfSpeech should be one of: verb, noun, adjective, adverb.
Example format:
[
  { "korean": "결과", "english": "outcome", "partOfSpeech": "noun", "example": "The outcome of the project was successful." }
]`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fix: Added togglePause function to handle pausing/resuming the session timer
  const togglePause = () => setIsPaused(prev => !prev);

  // Fix: Added adjustAutoDelay function to modify the auto-advance speed during a session
  const adjustAutoDelay = (amount: number) => {
    setSettings(prev => ({
      ...prev,
      autoAdvanceDelay: Math.max(1, Math.min(10, prev.autoAdvanceDelay + amount))
    }));
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (mode === AppMode.SESSION && !isPaused && words.length > 0) {
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
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [mode, currentIndex, isEnglishRevealed, isPaused, settings, handleNextWord, words.length]);

  if (mode === AppMode.WELCOME) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50 overflow-auto">
        <div className="w-full max-w-5xl text-center space-y-8 py-12">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight">
              Lingo<span className="text-indigo-600">Focus</span>
            </h1>
            <p className="text-slate-500 text-lg">Smart Vocabulary System with Persistent Review Tracking</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 w-full mt-12 px-4">
            <HomeCard 
              icon={<BookOpen size={32} />} 
              title="OPIc Prep" 
              desc="Daily life & social expressions"
              color="orange"
              onClick={() => handleStartSession(Category.OPIC)}
            />
            <HomeCard 
              icon={<Brain size={32} />} 
              title="AI & Tech" 
              desc="R&D and engineering terminology"
              color="blue"
              onClick={() => handleStartSession(Category.AI_ENGINEERING)}
            />
            <HomeCard 
              icon={<Sparkles size={32} />} 
              title="Custom Topic" 
              desc="Generate your own word sets"
              color="indigo"
              onClick={() => setMode(AppMode.CUSTOM_INPUT)}
            />
          </div>

          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 mx-auto text-slate-400 hover:text-indigo-600 transition-colors pt-8">
            <Settings size={18} /><span>Configure App Settings</span>
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

  if (mode === AppMode.CUSTOM_INPUT) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-12 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-10">
          <header className="flex items-center justify-between">
            <button onClick={() => setMode(AppMode.WELCOME)} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors">
              <ChevronLeft size={20} /> Back to Home
            </button>
            <h2 className="text-2xl font-bold">Custom Topic Study</h2>
          </header>

          <section className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Sparkles size={18} /> Step 1: Request from Gemini</h3>
              <button 
                onClick={copyPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                {copied ? <><ClipboardCheck size={14} /> Copied!</> : <><Copy size={14} /> Copy Prompt</>}
              </button>
            </div>
            <p className="text-sm text-indigo-700 leading-relaxed">
              Copy the prompt below and paste it into Gemini (ai.google.dev or gemini.google.com). Replace <b>[YOUR TOPIC]</b> with whatever you want to learn (e.g., "Sailing", "Medicine", "Philosophy").
            </p>
            <pre className="bg-slate-900 text-indigo-300 p-4 rounded-xl text-xs overflow-x-auto font-mono whitespace-pre-wrap">
              {PROMPT_TEMPLATE}
            </pre>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">Step 2: Paste JSON Result</h3>
            <textarea 
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Paste the JSON array from Gemini here..."
              className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
            <Button fullWidth onClick={handleCustomSubmit} disabled={!customInput.trim()}>
              Start Custom Session
            </Button>
          </section>
        </div>
      </div>
    );
  }

  if (mode === AppMode.LOADING) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div><h2 className="text-2xl font-bold text-slate-800">Loading Session...</h2></div>;

  if (mode === AppMode.SUMMARY) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600"><CheckCircle2 size={40} /></div>
        <h2 className="text-3xl font-bold text-slate-900">Session Complete!</h2>
        <p className="text-slate-500">Your review progress has been saved.</p>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Button variant="secondary" onClick={() => setMode(AppMode.WELCOME)}>Home</Button>
          <Button onClick={() => handleStartSession(settings.category)}>Restart</Button>
        </div>
      </div>
    </div>
  );

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => setMode(AppMode.WELCOME)} className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:rotate-6 transition-transform">L</div>
          <span className="font-bold text-xl text-slate-800 hidden sm:inline">LingoFocus</span>
        </button>
        <div className="flex-1 max-w-md mx-6">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-center text-slate-400 mt-1 font-mono">{currentIndex + 1} / {words.length}</p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><Settings size={20} /></button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div key={currentIndex} className="bg-white rounded-3xl shadow-xl overflow-hidden min-h-[460px] flex flex-col relative animate-in fade-in slide-in-from-bottom-4">
            <div className="h-2 bg-indigo-500 w-full" />
            <div className="px-8 py-4 flex justify-between items-center border-b border-slate-50">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase">{currentWord?.partOfSpeech}</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  <Repeat size={12} />
                  {currentWord?.reviewCount || 0}회 학습됨
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="space-y-4 mb-10">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">MEANING</span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">{currentWord?.korean}</h2>
              </div>

              {isEnglishRevealed && (
                <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-1 bg-indigo-600 mx-auto rounded-full"></div>
                  <div className="space-y-2">
                    <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">EXPRESSION</span>
                    <h3 className="text-3xl md:text-4xl font-bold text-indigo-600">{currentWord?.english}</h3>
                  </div>
                  {currentWord?.example && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-w-lg mx-auto">
                      <p className="text-slate-600 text-sm italic">"{currentWord.example}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                  <button onClick={() => adjustAutoDelay(-1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><Minus size={16} /></button>
                  <div className="flex items-center gap-2 px-1">
                    <Clock size={14} className="text-indigo-500" />
                    <span className="text-sm font-bold text-slate-700 min-w-[3rem] text-center">{settings.autoAdvanceDelay}s</span>
                  </div>
                  <button onClick={() => adjustAutoDelay(1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><Plus size={16} /></button>
                </div>
                <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-slate-300' : isEnglishRevealed ? 'bg-teal-500 animate-pulse' : 'bg-indigo-600'}`} />
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{isPaused ? 'Paused' : isEnglishRevealed ? 'Advancing soon' : 'Reveal in progress'}</span>
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
  const colors: any = {
    orange: "bg-orange-100 text-orange-600 hover:border-orange-500",
    blue: "bg-blue-100 text-blue-600 hover:border-blue-500",
    indigo: "bg-indigo-100 text-indigo-600 hover:border-indigo-500"
  };
  return (
    <div onClick={onClick} className="group cursor-pointer bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border-2 border-transparent relative overflow-hidden text-left flex flex-col space-y-4">
      <div className={`w-14 h-14 ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>{icon}</div>
      <div>
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        <p className="text-slate-400 text-sm mt-1">{desc}</p>
      </div>
      <div className="pt-2"><span className="text-indigo-600 font-bold text-sm group-hover:translate-x-1 inline-block transition-transform">Start Session &rarr;</span></div>
    </div>
  );
};

export default App;
