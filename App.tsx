
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
      playSound('pop'); // 시작 효과음
    } catch (error) {
      console.error("Failed to load words", error);
      setMode(AppMode.WELCOME);
    }
  };

  const handleNextWord = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsEnglishRevealed(false);
      playSound('pop'); // 다음 단어 효과음
    } else {
      setMode(AppMode.SUMMARY);
      playSound('success'); // 세션 종료 효과음
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

  // 학습 횟수 업데이트 및 상태 반영 로직
  const recordStudy = useCallback((wordId: string) => {
    const newCount = incrementReviewCount(wordId);
    setWords(prev => prev.map(w => w.id === wordId ? { ...w, reviewCount: newCount } : w));
  }, []);

  // 타이머 및 오디오 피드백 로직 통합
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);

    if (mode === AppMode.SESSION && !isPaused && words.length > 0) {
      const currentWord = words[currentIndex];

      if (!isEnglishRevealed) {
        // 생각하는 시간 동안 틱 소리 (1초 간격)
        tickIntervalRef.current = setInterval(() => {
          playSound('tick');
        }, 1000);

        timerRef.current = setTimeout(() => {
          setIsEnglishRevealed(true);
          speakEnglish(currentWord.english); // 영단어 노출 시 발음
          recordStudy(currentWord.id); // 회독수 즉시 증가 및 반영
          if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        }, settings.revealDelay * 1000);
      } else {
        // 자동 다음 단어 전환 타이머
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

  const PROMPT_TEMPLATE = `Please generate a list of 20 high-frequency English vocabulary words for the topic: [YOUR TOPIC HERE].
Provide the result strictly as a JSON array of objects with the following keys: "korean", "english", "partOfSpeech", "example".
The partOfSpeech should be one of: verb, noun, adjective, adverb.
Example format:
[
  { "korean": "결과", "english": "outcome", "partOfSpeech": "noun", "example": "The outcome of the project was successful." }
]`;

  if (mode === AppMode.WELCOME) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="w-full max-w-7xl text-center space-y-16">
          <div className="space-y-4">
            <h1 className="text-7xl md:text-9xl font-black text-slate-900 tracking-tighter">
              Lingo<span className="text-indigo-600">Focus</span>
            </h1>
            <p className="text-slate-500 text-2xl font-medium tracking-tight">OPIc & AI Engineering Smart Vocabulary Trainer</p>
          </div>

          {/* 3개 메뉴 가로 배치 */}
          <div className="flex flex-col md:flex-row gap-8 w-full px-4 justify-center items-stretch">
            <HomeCard 
              icon={<BookOpen size={48} />} 
              title="OPIc Master" 
              desc="Natural speaking phrases for high scores"
              color="orange"
              onClick={() => handleStartSession(Category.OPIC)}
            />
            <HomeCard 
              icon={<Brain size={48} />} 
              title="AI Research" 
              desc="Technical terms for R&D professionals"
              color="blue"
              onClick={() => handleStartSession(Category.AI_ENGINEERING)}
            />
            <HomeCard 
              icon={<Sparkles size={48} />} 
              title="Custom Topic" 
              desc="AI-powered word sets for any topic"
              color="indigo"
              onClick={() => setMode(AppMode.CUSTOM_INPUT)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-10 text-slate-400 font-bold text-sm uppercase tracking-widest">
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100"><Volume2 size={16} className="text-indigo-500" /> Auto TTS</span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100"><Clock size={16} className="text-indigo-500" /> Timed Interval</span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100"><Repeat size={16} className="text-indigo-500" /> Global Progress</span>
            <span className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100" onClick={() => setIsSettingsOpen(true)}><Settings size={16} /> Preferences</span>
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
        <div className="max-w-5xl mx-auto space-y-12">
          <header className="flex items-center justify-between border-b pb-8">
            <button onClick={() => setMode(AppMode.WELCOME)} className="flex items-center gap-3 text-slate-400 hover:text-slate-800 transition-colors font-black text-lg">
              <ChevronLeft size={28} /> BACK
            </button>
            <div className="text-right">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">AI TOPIC GENERATOR</h2>
              <p className="text-slate-400 font-bold text-sm uppercase">Create your own learning path</p>
            </div>
          </header>

          <div className="grid lg:grid-cols-2 gap-12">
            <section className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform"><Sparkles size={120} /></div>
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-2xl font-black flex items-center gap-3"><Sparkles className="text-indigo-400" /> Step 1: Copy Prompt</h3>
                <button 
                  onClick={() => { navigator.clipboard.writeText(PROMPT_TEMPLATE); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all active:scale-90"
                >
                  {copied ? <ClipboardCheck size={24} className="text-green-400" /> : <Copy size={24} />}
                </button>
              </div>
              <p className="text-slate-400 text-lg font-medium leading-relaxed relative z-10">Use this prompt with Gemini to generate high-quality vocabulary in JSON format.</p>
              <div className="bg-black/40 p-6 rounded-3xl font-mono text-sm text-indigo-300 border border-white/5 whitespace-pre-wrap leading-relaxed relative z-10 shadow-inner">
                {PROMPT_TEMPLATE}
              </div>
            </section>

            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black">2</div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Paste JSON Result</h3>
              </div>
              <textarea 
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Paste the array from Gemini here..."
                className="w-full h-[350px] p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] focus:border-indigo-500 focus:bg-white outline-none font-mono text-sm transition-all shadow-inner"
              />
              <Button fullWidth onClick={handleCustomSubmit} disabled={!customInput.trim()} className="py-6 text-xl rounded-[2rem]">
                Generate Flashcards & Start
              </Button>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (mode === AppMode.LOADING) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="relative w-32 h-32 mb-10">
        <div className="absolute inset-0 border-8 border-indigo-100 rounded-full"></div>
        <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <h2 className="text-3xl font-black text-slate-800 tracking-tighter">SYNCHRONIZING DATABASE...</h2>
      <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">Loading Word List</p>
    </div>
  );

  if (mode === AppMode.SUMMARY) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-600 p-6">
      <div className="bg-white p-16 rounded-[4rem] shadow-2xl max-w-xl w-full text-center space-y-10 animate-in zoom-in duration-500">
        <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner"><CheckCircle2 size={64} /></div>
        <div className="space-y-3">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Session Done!</h2>
          <p className="text-slate-400 text-lg font-bold">Your review counts have been updated globally.</p>
        </div>
        <div className="flex flex-col gap-4">
          <Button onClick={() => handleStartSession(settings.category)} className="py-6 text-xl rounded-3xl">RESTART SESSION</Button>
          <Button variant="secondary" onClick={() => setMode(AppMode.WELCOME)} className="py-6 text-xl rounded-3xl">BACK TO MENU</Button>
        </div>
      </div>
    </div>
  );

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col select-none overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-10 py-6 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => setMode(AppMode.WELCOME)} className="flex items-center gap-4 group">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg shadow-indigo-200">LF</div>
          <span className="font-black text-3xl text-slate-800 tracking-tighter">LingoFocus</span>
        </button>
        <div className="flex-1 max-w-2xl mx-12">
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
            <div className="h-full bg-indigo-600 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-3 px-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Session Progress</span>
            <span className="text-[11px] font-black text-indigo-600 tracking-widest">{currentIndex + 1} / {words.length}</span>
          </div>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-4 hover:bg-slate-100 rounded-3xl text-slate-500 transition-all active:scale-90 shadow-sm border border-slate-100"><Settings size={28} /></button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <div key={currentIndex} className="bg-white rounded-[4rem] shadow-2xl overflow-hidden min-h-[580px] flex flex-col relative animate-in fade-in slide-in-from-bottom-6 transition-all border border-slate-50">
            <div className="h-4 bg-indigo-500 w-full" />
            
            <div className="px-12 py-8 flex justify-between items-center border-b border-slate-100 bg-slate-50/30">
              <span className="px-6 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-md shadow-indigo-100">{currentWord?.partOfSpeech}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-indigo-600 bg-white px-6 py-2 rounded-2xl border-2 border-indigo-100 shadow-sm">
                  <Repeat size={18} strokeWidth={3} />
                  <span className="text-lg font-black">{currentWord?.reviewCount || 0}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Reviews</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
              <div className="space-y-6 mb-16">
                <span className="text-slate-300 text-xs font-black uppercase tracking-[0.3em]">Korean Definition</span>
                <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[1.1]">{currentWord?.korean}</h2>
              </div>

              {isEnglishRevealed ? (
                <div className="space-y-10 animate-in fade-in zoom-in duration-700">
                  <div className="w-32 h-3 bg-indigo-600 mx-auto rounded-full shadow-sm"></div>
                  <div className="space-y-4">
                    <span className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                      <Volume2 size={20} /> English Expression
                    </span>
                    <h3 className="text-5xl md:text-7xl font-black text-indigo-600 tracking-tighter">{currentWord?.english}</h3>
                  </div>
                  {currentWord?.example && (
                    <div className="bg-indigo-50/50 p-8 rounded-[3rem] border-2 border-indigo-100/50 max-w-2xl mx-auto shadow-inner">
                      <p className="text-slate-700 text-2xl font-bold italic leading-relaxed">"{currentWord.example}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center">
                   <div className="flex gap-4 items-end">
                     <div className="w-5 h-5 bg-indigo-100 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '0.6s' }}></div>
                     <div className="w-5 h-5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }}></div>
                     <div className="w-5 h-5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.6s' }}></div>
                   </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-10 border-t border-slate-100 space-y-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6 bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
                  <button onClick={() => adjustAutoDelay(-1)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"><Minus size={24} /></button>
                  <div className="flex items-center gap-4 px-2">
                    <Clock size={22} className="text-indigo-500" />
                    <span className="text-2xl font-black text-slate-800 min-w-[4rem] text-center">{settings.autoAdvanceDelay}s</span>
                  </div>
                  <button onClick={() => adjustAutoDelay(1)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"><Plus size={24} /></button>
                </div>
                <div className="px-8 py-4 bg-white rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${isPaused ? 'bg-slate-300' : isEnglishRevealed ? 'bg-teal-500 animate-pulse shadow-[0_0_12px_rgba(20,184,166,0.6)]' : 'bg-indigo-600 animate-pulse shadow-[0_0_12px_rgba(79,70,229,0.6)]'}`} />
                  <span className="text-sm text-slate-500 font-black uppercase tracking-widest">
                    {isPaused ? 'Paused' : isEnglishRevealed ? 'Next word pending' : 'Thinking time...'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-8">
                <Button onClick={handlePreviousWord} disabled={currentIndex === 0} variant="secondary" className="px-12 py-6 rounded-[2.5rem]"><ChevronLeft size={40} /></Button>
                <Button onClick={togglePause} variant={isPaused ? "primary" : "outline"} className="flex-1 flex items-center justify-center gap-4 py-6 rounded-[2.5rem] text-2xl font-black tracking-tight">
                  {isPaused ? <><Play size={32} fill="currentColor" /> RESUME</> : <><Pause size={32} fill="currentColor" /> PAUSE</>}
                </Button>
                <Button onClick={handleNextWord} className="px-12 py-6 rounded-[2.5rem]"><ChevronRight size={40} /></Button>
              </div>
            </div>

            {!isPaused && words.length > 0 && (
              <div key={`timer-${currentIndex}-${isEnglishRevealed}`} className={`absolute bottom-0 left-0 h-3 transition-all ease-linear ${isEnglishRevealed ? 'bg-teal-500' : 'bg-indigo-600'}`}
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
    orange: "bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-500 hover:bg-orange-100 shadow-orange-100/30",
    blue: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-500 hover:bg-blue-100 shadow-blue-100/30",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-100 shadow-indigo-100/30"
  };
  return (
    <div onClick={onClick} className={`group cursor-pointer p-12 rounded-[3.5rem] shadow-xl transition-all border-4 flex flex-col items-center text-center space-y-8 flex-1 min-w-[320px] ${themes[color]} transform hover:-translate-y-4 hover:rotate-1`}>
      <div className="p-8 bg-white rounded-[2.5rem] shadow-lg group-hover:scale-110 transition-transform group-hover:rotate-6 ring-8 ring-white/50">{icon}</div>
      <div className="space-y-3">
        <h3 className="text-3xl font-black tracking-tight uppercase leading-none">{title}</h3>
        <p className="text-slate-500 text-lg font-bold leading-tight opacity-70">{desc}</p>
      </div>
      <div className="pt-4"><span className="px-10 py-4 bg-white rounded-full font-black text-sm uppercase tracking-widest shadow-md group-hover:bg-indigo-600 group-hover:text-white transition-all">Start &rarr;</span></div>
    </div>
  );
};

export default App;
