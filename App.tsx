
import React, { useState, useCallback, useMemo } from 'react';
import { AppMode, Category, SessionSettings, WordItem, WordSet, SentenceSet } from './types';
import { getAllSets, getSetsByCategory, saveNewSet, deleteSet, incrementReviewCount, getStoredReviewCount, getSentenceSetsByWordSetId, saveSentenceSet, deleteSentenceSet } from './services/storageService';
import { generateWordSet, generateSentenceSet } from './services/geminiService';
import { playSound } from './services/audioService';

import { WelcomeView } from './components/views/WelcomeView';
import { SetListView } from './components/views/SetListView';
import { GeneratorView } from './components/views/GeneratorView';
import { SessionView } from './components/views/SessionView';
import { SummaryView } from './components/views/SummaryView';
import { LoadingView } from './components/views/LoadingView';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  // --- Core State ---
  const [mode, setMode] = useState<AppMode>(AppMode.WELCOME);
  const [activeCategory, setActiveCategory] = useState<Category>(Category.OPIC);
  const [availableSets, setAvailableSets] = useState<WordSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<WordSet | null>(null);
  const [sessionWords, setSessionWords] = useState<WordItem[]>([]);
  
  const [settings, setSettings] = useState<SessionSettings>({
    category: Category.OPIC,
    revealDelay: 3,
    autoAdvanceDelay: 3,
    batchSize: 50,
    readKoreanAloud: false
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Derived State (Sentence Sets for Topic Selection) ---
  const sentenceSetsMap = useMemo(() => {
    const map: Record<string, SentenceSet[]> = {};
    availableSets.forEach(set => {
      map[set.id] = getSentenceSetsByWordSetId(set.id);
    });
    return map;
  }, [availableSets]);

  // --- Navigation & Handlers ---
  const loadCategorySets = useCallback((cat: Category) => {
    setActiveCategory(cat);
    setAvailableSets(getSetsByCategory(cat));
    setMode(AppMode.SET_LIST);
  }, []);

  const startSession = useCallback((set: WordSet | SentenceSet) => {
    if ('words' in set) {
      const prepared = [...set.words].map(w => ({ ...w, reviewCount: getStoredReviewCount(w.id) }));
      // Shuffle
      for (let i = prepared.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [prepared[i], prepared[j]] = [prepared[j], prepared[i]];
      }
      setSessionWords(prepared.slice(0, settings.batchSize));
      setSelectedSet(set as WordSet);
    } else {
      setSessionWords(set.sentences.map(s => ({ ...s, reviewCount: getStoredReviewCount(s.id) })));
      setSelectedSet({ id: set.wordSetId, topic: `${set.topic} (Response)` } as any);
    }
    setMode(AppMode.SESSION);
    playSound('pop');
  }, [settings.batchSize]);

  const handleGenerateWordSet = useCallback(async (cat: Category, topic: string) => {
    setMode(AppMode.LOADING);
    try {
      const s = await generateWordSet(cat, topic);
      saveNewSet(s);
      loadCategorySets(cat);
      playSound('success');
    } catch (e) {
      alert("Generation Failed");
      setMode(AppMode.GENERATOR);
    }
  }, [loadCategorySets]);

  const handleGenerateSentences = useCallback(async (set: WordSet) => {
    setMode(AppMode.LOADING);
    try {
      const ss = await generateSentenceSet(set);
      saveSentenceSet(ss);
      playSound('success');
      loadCategorySets(set.category);
    } catch (e) {
      alert("Failed to generate sentences");
      loadCategorySets(set.category);
    }
  }, [loadCategorySets]);

  const handleDeleteSet = useCallback((id: string) => {
    if(confirm("정말 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) {
      deleteSet(id);
      setAvailableSets(prev => prev.filter(s => s.id !== id));
      playSound('pop');
    }
  }, []);

  const handleDeleteSentenceSet = useCallback((id: string) => {
    if(confirm("이 문장 세트를 삭제하시겠습니까?")) {
      deleteSentenceSet(id);
      // Trigger a re-render of topics list to update map
      setAvailableSets(prev => [...prev]);
      playSound('pop');
    }
  }, []);

  const counts = useMemo(() => {
    const all = getAllSets();
    return {
      [Category.OPIC]: all.filter(s => s.category === Category.OPIC).reduce((acc, s) => acc + s.words.length, 0),
      [Category.SUBJECT_VERB]: all.filter(s => s.category === Category.SUBJECT_VERB).reduce((acc, s) => acc + s.words.length, 0)
    };
  }, [availableSets]);

  // --- Router ---
  const renderView = () => {
    switch (mode) {
      case AppMode.WELCOME:
        return (
          <WelcomeView 
            counts={counts}
            onLoadCategory={loadCategorySets}
            onOpenGenerator={() => setMode(AppMode.GENERATOR)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        );
      case AppMode.SET_LIST:
        return (
          <SetListView 
            category={activeCategory}
            availableSets={availableSets}
            onBack={() => setMode(AppMode.WELCOME)}
            onStartSession={startSession}
            onDeleteSet={handleDeleteSet}
            onGenerateSentences={handleGenerateSentences}
            sentenceSetsMap={sentenceSetsMap}
            onDeleteSentenceSet={handleDeleteSentenceSet}
          />
        );
      case AppMode.GENERATOR:
        return (
          <GeneratorView 
            onBack={() => setMode(AppMode.WELCOME)}
            onGenerate={handleGenerateWordSet}
          />
        );
      case AppMode.LOADING:
        return <LoadingView />;
      case AppMode.SUMMARY:
        return (
          <SummaryView 
            onRestart={() => setMode(AppMode.SESSION)}
            onGoToTopics={() => setMode(AppMode.SET_LIST)}
          />
        );
      case AppMode.SESSION:
        return (
          <SessionView 
            topic={selectedSet?.topic || "Learning"}
            words={sessionWords}
            settings={settings}
            onFinish={() => setMode(AppMode.SUMMARY)}
            onExit={() => setMode(AppMode.SET_LIST)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onUpdateSettings={setSettings}
            onRecordStudy={incrementReviewCount}
          />
        );
      default:
        return <LoadingView />;
    }
  };

  return (
    <>
      {renderView()}
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
    </>
  );
};

export default App;
