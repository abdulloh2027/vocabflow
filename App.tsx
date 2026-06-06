import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  Home, BookOpen, Library, GraduationCap, Play, Pause, SkipForward, SkipBack, 
  Trash2, Plus, LogOut, CheckCircle, XCircle 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==========================================
// TYPES & CONSTANTS
// ==========================================
type Word = {
  id: string;
  en: string;
  tr: string;
  addedAt: number;
  learned: boolean;
};

type TestResult = {
  date: number;
  score: number;
  total: number;
};

type Stats = {
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
  totalLearned: number;
  testScores: TestResult[];
};

const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

// ==========================================
// UTILS
// ==========================================
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// ==========================================
// Custom Hook for Setup & Local Storage
// ==========================================
function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// ==========================================
// COMPONENTS
// ==========================================

export default function App() {
  const [isAuth, setIsAuth] = useLocalStorage('vocabflow_auth', false);
  const [passwordInput, setPasswordInput] = useState('');
  
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-8 text-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 scale-105 shadow-lg shadow-indigo-500/20">
              <GraduationCap className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Linguist<span className="text-indigo-400">Pro</span></h1>
            <p className="text-slate-400 mt-2">Sign in to start learning</p>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (passwordInput.trim().length > 3) {
              setIsAuth(true);
            } else {
              alert("Password must be at least 4 characters for this demo.");
            }
          }}>
             <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase ml-1 mb-2">Username</label>
              <input type="text" defaultValue="learner" className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase ml-1 mb-2">Password</label>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter anything >3 chars"
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                required
              />
            </div>
            <button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 mt-4">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <MainApp onLogout={() => setIsAuth(false)} />;
}

// ------------------------------------------
// MAIN APP COMPONENT
// ------------------------------------------
function MainApp({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'stats' | 'study' | 'dict' | 'test'>('study');
  
  // Data
  const [words, setWords] = useLocalStorage<Word[]>('vocabflow_words', []);
  const [stats, setStats] = useLocalStorage<Stats>('vocabflow_stats', {
    streak: 0,
    lastStudyDate: '',
    totalLearned: 0,
    testScores: []
  });

  // Calculate Streak
  useEffect(() => {
    const today = getTodayStr();
    if (stats.lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // If last study wasn't yesterday, break streak. Unless they haven't studied today yet, then keep it visually but update on action.
      // We will only update streak strictly on study action.
    }
  }, [stats.lastStudyDate]);

  const updateStudyStreakAction = () => {
    const today = getTodayStr();
    setStats(prev => {
      if (prev.lastStudyDate === today) return prev; // Already updated today
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const isConsecutive = prev.lastStudyDate === yesterdayStr;
      
      return {
        ...prev,
        streak: isConsecutive ? prev.streak + 1 : 1,
        lastStudyDate: today,
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 font-sans text-slate-100 select-none">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-40 bg-slate-950/90 backdrop-blur pb-4 pt-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">Linguist<span className="text-indigo-400">Pro</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-bold gap-1">
            <span className="text-orange-500">🔥</span>
            <span>{stats.streak} Day</span>
          </div>
          <button onClick={onLogout} className="text-slate-500 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 max-w-2xl mx-auto w-full">
        {activeTab === 'stats' && <DashboardTab words={words} stats={stats} />}
        {activeTab === 'study' && <StudyTab words={words} setWords={setWords} updateStreak={updateStudyStreakAction} />}
        {activeTab === 'dict' && <DictionaryTab words={words} setWords={setWords} />}
        {activeTab === 'test' && <TestTab words={words} setStats={setStats} stats={stats} />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 h-16 rounded-2xl z-50">
        <ul className="flex justify-around items-center h-full max-w-md mx-auto">
          <NavItem icon={<Home />} label="Stats" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
          <NavItem icon={<Play />} label="Study" active={activeTab === 'study'} onClick={() => setActiveTab('study')} special />
          <NavItem icon={<Library />} label="Words" active={activeTab === 'dict'} onClick={() => setActiveTab('dict')} />
          <NavItem icon={<BookOpen />} label="Quiz" active={activeTab === 'test'} onClick={() => setActiveTab('test')} />
        </ul>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, special, onClick }: any) {
  return (
    <li className="flex-1 h-full">
      <button 
        onClick={onClick}
        className={cn(
          "w-full h-full flex flex-col items-center justify-center gap-1 transition-all",
          special && "transform -translate-y-2",
          active ? (special ? "text-indigo-400" : "text-white") : "text-slate-500 hover:text-white"
        )}
      >
        <div className={cn(
          "transition-all duration-300 flex flex-col items-center",
          special ? "bg-indigo-600 text-white p-3 rounded-full shadow-lg shadow-indigo-600/40 h-12 w-12 justify-center" : "justify-center",
          active && special ? "scale-105" : ""
        )}>
          {React.cloneElement(icon, { className: special ? "w-6 h-6" : "w-6 h-6", strokeWidth: special ? 2.5 : 2 })}
          {!special && <span className={cn("text-[10px] uppercase font-bold tracking-widest mt-1 hidden sm:block", active ? "text-indigo-400" : "text-inherit")}>{label}</span>}
        </div>
      </button>
    </li>
  );
}

// ------------------------------------------
// STATS DASHBOARD
// ------------------------------------------
function DashboardTab({ words, stats }: { words: Word[], stats: Stats }) {
  const addedCount = words.length;
  const learnedCount = words.filter(w => w.learned).length;
  
  // Build chart data for test scores
  const chartData = useMemo(() => {
    if (!stats.testScores.length) return [];
    return stats.testScores.slice(-10).map((score) => {
      const d = new Date(score.date);
      return {
        name: `${d.getMonth()+1}/${d.getDate()}`,
        score: Math.round((score.score / score.total) * 100)
      };
    });
  }, [stats.testScores]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">Performance</h3>
      
      {/* Big Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col items-center justify-center">
          <p className="text-xs text-slate-500 mb-1">Words Added</p>
          <p className="text-4xl font-bold text-white">{addedCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-xs text-slate-500 mb-1 relative z-10">Words Learned</p>
          <p className="text-4xl font-bold text-emerald-400 relative z-10">{learnedCount}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 mt-4">
          <h3 className="text-xs text-slate-500 mb-6">Recent Test Accuracies (%)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: '1px solid #1E293B', backgroundColor: '#0F172A', color: '#F1F5F9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)'}} 
                />
                <Area type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 mt-4 text-center text-slate-500">
          <GraduationCap className="mx-auto h-8 w-8 text-slate-700 mb-3" />
          <p className="text-sm">Take some tests to see your progress chart!</p>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------
// ADD VOCAB & STUDY SCREEN (Core functionality)
// ------------------------------------------
function StudyTab({ words, setWords, updateStreak }: { words: Word[], setWords: any, updateStreak: () => void }) {
  const [enInput, setEnInput] = useState('');
  const [trInput, setTrInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Background Audio Ref for mobile persistence
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synth = window.speechSynthesis;

  // Cleanup effect
  useEffect(() => {
    return () => {
      synth.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enInput.trim() || !trInput.trim()) return;
    
    const newWord: Word = {
      id: generateId(),
      en: enInput.trim(),
      tr: trInput.trim(),
      addedAt: Date.now(),
      learned: false
    };
    
    setWords((prev: Word[]) => [newWord, ...prev]);
    setEnInput('');
    setTrInput('');
  };

  // Setup Background Media Context
  const initAudioTools = () => {
    if (!audioRef.current) {
      const a = new Audio(SILENT_WAV);
      a.loop = true;
      a.crossOrigin = "anonymous";
      audioRef.current = a;
    }
  };

  const updateMediaState = (idx: number, w: Word[]) => {
    if ('mediaSession' in navigator) {
      if (!w[idx]) return;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: w[idx].en,
        artist: 'VocabFlow Study',
        album: 'Learning Session',
        artwork: [
          { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      });
    }
  };

  // Play next word in sequence automatically
  const playWordSeq = (word: Word, onComplete: () => void) => {
    if (!isPlaying) return;
    synth.cancel();

    const voices = synth.getVoices();
    // Prefer English/US for en, anything for tr (fallback to default)
    const enVoice = voices.find(v => v.lang.startsWith('en-')) || null;
    // Just a placeholder matching for Uzbek / generic default if not found
    const trVoice = voices.find(v => v.lang.startsWith('uz-') || v.lang.startsWith('tr-')) || null;

    const u1 = new SpeechSynthesisUtterance(word.en);
    if (enVoice) u1.voice = enVoice;
    u1.rate = 0.85;

    const u2 = new SpeechSynthesisUtterance(word.tr);
    if (trVoice) u2.voice = trVoice;
    u2.rate = 0.85;

    // Pattern: EN -> Pause -> TR -> Pause -> repeat twice
    // For simplicity, we just queue utterances
    
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    const speak = (u: SpeechSynthesisUtterance): Promise<void> => {
      return new Promise((resolve) => {
        u.onend = () => resolve();
        u.onerror = () => resolve();
        synth.speak(u);
      });
    };

    const runSeq = async () => {
      // Loop twice per word
      for(let i = 0; i < 2; i++) {
        if (!isPlaying) return;
        await speak(u1);
        if (!isPlaying) return;
        await wait(600);
        await speak(u2);
        if (!isPlaying) return;
        await wait(1000);
      }
      onComplete();
    };

    runSeq();
  };

  const playSession = async () => {
    if (words.length === 0) return;
    
    initAudioTools();
    
    if (audioRef.current) {
      await audioRef.current.play().catch(e => console.error(e));
    }

    setIsPlaying(true);
    updateStreak();

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.setActionHandler('play', () => { setIsPlaying(true); });
      navigator.mediaSession.setActionHandler('pause', () => { setIsPlaying(false); });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        setCurrentIndex(prev => prev > 0 ? prev - 1 : 0);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        setCurrentIndex(prev => prev < words.length - 1 ? prev + 1 : prev);
      });
    }
  };

  const pauseSession = () => {
    setIsPlaying(false);
    synth.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  };

  // React strictly to isPlaying and currentIndex changes
  useEffect(() => {
    if (isPlaying && words.length > 0) {
      updateMediaState(currentIndex, words);
      playWordSeq(words[currentIndex], () => {
        if (currentIndex < words.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Finished playlist
          pauseSession();
        }
      });
    } else {
      synth.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentIndex, words]);


  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      
      {/* PLAYER WIDGET (Like a Music Player) */}
      <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 p-6">
          <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Active Session</span>
        </div>
        
        <div className="relative z-10 flex flex-col items-center mt-6">
          <div className="w-40 h-40 bg-slate-800 rounded-2xl flex items-center justify-center shadow-2xl border border-slate-700 mb-6">
            <span className="text-6xl text-slate-400">
               {words.length > 0 && isPlaying ? <Play className="w-16 h-16 text-indigo-500" /> : <Library className="w-16 h-16 text-slate-600" />}
            </span>
          </div>

          <div className="text-center mb-6 w-full max-w-xs">
            {words.length === 0 ? (
               <p className="text-slate-400 text-sm italic py-4">Add some words below to start learning.</p>
            ) : (
               <>
                 <h3 className="text-4xl font-black mb-2 text-white truncate px-2">{words[currentIndex]?.en || '---'}</h3>
                 <p className="text-xl text-slate-400 italic font-serif truncate px-2">"{words[currentIndex]?.tr || '---'}"</p>
                 
                 <div className="mt-8 mb-2 h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                     style={{width: words.length > 0 ? `${((currentIndex + 1) / words.length) * 100}%` : '0%'}}
                   />
                 </div>
                 <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                   <span>Word {words.length > 0 ? currentIndex + 1 : 0} of {words.length}</span>
                   <span>{isPlaying ? 'Playing' : 'Paused'}</span>
                 </div>
               </>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-2">
            <button 
              className="p-3 text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-slate-500"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={words.length === 0 || currentIndex === 0}
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>
            
            <button 
              className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-50 disabled:hover:scale-100"
              onClick={isPlaying ? pauseSession : playSession}
              disabled={words.length === 0}
            >
              {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>

            <button 
              className="p-3 text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-slate-500"
              onClick={() => setCurrentIndex(prev => Math.min(words.length - 1, prev + 1))}
              disabled={words.length === 0 || currentIndex === words.length - 1}
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>
          </div>
        </div>
      </div>
      
      {/* ADD WORD CARD */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Add Vocabulary</h2>
        <form onSubmit={handleAddWord} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 block">English</label>
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                placeholder="e.g. Luminous"
                value={enInput}
                onChange={e => setEnInput(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Translation</label>
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                placeholder="e.g. Nurafshon"
                value={trInput}
                onChange={e => setTrInput(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 pt-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center space-x-2 text-sm z-10 relative">
            <Plus className="w-4 h-4" />
            <span>Add Word</span>
          </button>
        </form>
      </div>

    </div>
  );
}

// ------------------------------------------
// DICTIONARY TAB
// ------------------------------------------
function DictionaryTab({ words, setWords }: { words: Word[], setWords: any }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'alpha'>('date');

  const filteredWords = Object.values(words).filter(w => 
    w.en.toLowerCase().includes(search.toLowerCase()) || 
    w.tr.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'alpha') return a.en.localeCompare(b.en);
    return b.addedAt - a.addedAt; // newest first
  });

  const deleteWord = (id: string) => {
    if (window.confirm("Delete this word?")) {
      setWords((prev: Word[]) => prev.filter(w => w.id !== id));
    }
  };

  const markLearned = (id: string) => {
    setWords((prev: Word[]) => prev.map(w => w.id === id ? { ...w, learned: !w.learned } : w));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 h-[calc(100vh-160px)] flex flex-col">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col h-full">
        <h3 className="text-lg font-bold mb-4 text-white">My Dictionary</h3>
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search words..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">
            <Library className="w-4 h-4" />
          </div>
          <div className="absolute right-2 top-1.5 focus-within:ring-2 focus-within:ring-indigo-500 rounded font-bold uppercase tracking-widest text-slate-400 text-xs">
            <select 
              className="bg-transparent border-none text-xs text-slate-400 font-bold uppercase tracking-widest focus:ring-0 cursor-pointer appearance-none px-2 py-1"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'date'|'alpha')}
            >
              <option value="date" className="bg-slate-900 text-white">DATE</option>
              <option value="alpha" className="bg-slate-900 text-white">A-Z</option>
            </select>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto space-y-2 pr-1" style={{scrollbarWidth: 'none'}}>
          {filteredWords.length === 0 ? (
             <div className="text-center py-10 text-slate-500 text-sm italic">No words found.</div>
          ) : (
            filteredWords.map(word => (
              <div key={word.id} className={cn("p-3 bg-slate-800/50 rounded-xl border flex justify-between items-center group transition-colors hover:bg-slate-800", word.learned ? "border-l-4 border-l-emerald-500 border-t-slate-800 border-r-slate-800 border-b-slate-800" : "border-slate-800")}>
                <div>
                  <p className={cn("font-bold text-sm", word.learned ? "text-emerald-400" : "text-slate-200")}>{word.en}</p>
                  <p className="text-xs text-slate-400 italic font-serif mt-0.5">{word.tr}</p>
                </div>
                <div className="flex items-center space-x-2">
                   <button 
                    onClick={() => markLearned(word.id)}
                    className="p-1.5 text-slate-600 hover:text-emerald-400 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteWord(word.id)}
                    className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------
// TEST GENERATOR & UI
// ------------------------------------------
function TestTab({ words, setStats, stats }: { words: Word[], setStats: any, stats: Stats }) {
  const [learningWords, setLearningWords] = useState<Word[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [options, setOptions] = useState<Word[]>([]);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'start' | 'playing' | 'end'>('start');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const startTest = () => {
    if (words.length < 4) {
      alert("You need at least 4 words in your dictionary to take a test.");
      return;
    }
    // Pick 10 random words or all if < 10
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const testSessionWords = shuffled.slice(0, 10);
    setLearningWords(testSessionWords);
    setCurrentQIndex(0);
    setScore(0);
    setStatus('playing');
    generateOptions(testSessionWords[0], words);
  };

  const generateOptions = (correctWord: Word, allWords: Word[]) => {
    const others = allWords.filter(w => w.id !== correctWord.id).sort(() => 0.5 - Math.random());
    const distractors = others.slice(0, 3);
    const multi = [...distractors, correctWord].sort(() => 0.5 - Math.random());
    setOptions(multi);
    setSelectedOption(null);
  };

  const handleSelect = (selectedId: string) => {
    if (selectedOption !== null) return; // Prevent double click
    
    setSelectedOption(selectedId);
    
    const correctId = learningWords[currentQIndex].id;
    if (selectedId === correctId) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentQIndex < learningWords.length - 1) {
        setCurrentQIndex(prev => prev + 1);
        generateOptions(learningWords[currentQIndex + 1], words);
      } else {
        finishTest(score + (selectedId === correctId ? 1 : 0), learningWords.length);
      }
    }, 1200);
  };

  const finishTest = (finalScore: number, total: number) => {
    setStatus('end');
    setStats((prev: Stats) => ({
      ...prev,
      testScores: [...prev.testScores, { date: Date.now(), score: finalScore, total }]
    }));
  };

  if (status === 'start') {
    return (
      <div className="flex flex-col h-full items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-500 bg-slate-900 border border-slate-800 rounded-3xl p-8 mt-4">
        <div className="w-20 h-20 bg-indigo-900/40 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
          <BookOpen className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-white tracking-tight">Quick Quiz</h2>
        <p className="text-slate-400 mb-8 max-w-xs text-sm">Test your memory on the words you've added. You'll get 10 random questions.</p>
        <button 
          onClick={startTest}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
        >
          Start Quiz Now
        </button>
      </div>
    );
  }

  if (status === 'end') {
    const percentage = Math.round((score / learningWords.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in zoom-in-95 duration-500 bg-slate-900 border border-slate-800 rounded-3xl p-8 mt-4">
        <div className="text-6xl font-black mb-4 tracking-tighter text-white">
          {percentage}%
        </div>
        <p className="text-sm text-slate-400 mb-8 font-medium">You got {score} out of {learningWords.length} correct.</p>
        
        <button 
          onClick={startTest}
          className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold active:scale-95 transition-all text-sm uppercase tracking-widest"
        >
          Try Again
        </button>
      </div>
    );
  }

  const correctWord = learningWords[currentQIndex];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 pt-8 mt-4 animate-in slide-in-from-right-8 duration-300">
      {/* Progress */}
      <div className="flex justify-between items-center mb-8 px-1">
        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Question {currentQIndex + 1}/{learningWords.length}</span>
        <div className="flex space-x-1">
           {learningWords.map((_, i) => (
             <div key={i} className={cn("h-1 w-3 rounded-full", i <= currentQIndex ? "bg-indigo-500" : "bg-slate-800")} />
           ))}
        </div>
      </div>

      <div className="mb-8 px-1 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Translate</p>
        <h3 className="font-black text-3xl text-white tracking-tight">"{correctWord.en}"</h3>
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.id;
          const isCorrect = correctWord.id === opt.id;
          const showColors = selectedOption !== null;

          let btnClass = "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700";
          
          if (showColors) {
            if (isCorrect) {
              btnClass = "bg-emerald-900/30 border-emerald-500/50 text-emerald-400 font-bold z-10 relative shadow-lg shadow-emerald-900/20";
            } else if (isSelected && !isCorrect) {
              btnClass = "bg-red-900/20 border-red-500/30 text-red-400 font-bold opacity-70";
            } else {
              btnClass = "bg-slate-900 border-slate-800 text-slate-600 opacity-50";
            }
          }

          return (
            <button
              key={opt.id}
              disabled={selectedOption !== null}
              onClick={() => handleSelect(opt.id)}
              className={cn(
                "w-full text-left px-5 py-4 rounded-xl transition-all text-sm font-medium",
                btnClass
              )}
            >
              <div className="flex items-center justify-between">
                <span>{opt.tr}</span>
                {showColors && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {showColors && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

