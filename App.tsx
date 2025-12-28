import React, { useState, useRef, useEffect } from 'react';
import { generateHorrorStory, generateHorrorSpeech, generateHorrorImage } from './services/geminiService';
import { AppStatus, StoryState, HorrorIntensity, VisualTheme, Language, UserProfile } from './types';
import GlitchText from './components/GlitchText';
import LoadingScreen from './components/LoadingScreen';
import AudioPlayer from './components/AudioPlayer';
import SettingsModal from './components/SettingsModal';
import StoryLibrary from './components/StoryLibrary';
import AmbientSound from './components/AmbientSound';
import Feedback from './components/Feedback';
import JumpScare from './components/JumpScare';
import ShareModal from './components/ShareModal';
import { Ghost, RefreshCw, AlertTriangle, Settings, Share2, Copy, Check, Twitter, BookOpen, Save, Trash2, Sparkles, Plus, Edit2, X, PenTool, Eye } from 'lucide-react';

// Translations configuration
const TRANSLATIONS = {
  ja: {
    appTitle: "怪談",
    appSubtitle: "Artificial Intelligence Horror Stories",
    inputLabel: "あなたの恐怖を教えてください...",
    inputPlaceholder: "例: 深夜の廃校、日本人形、鏡に映る知らない顔",
    generateBtn: "物語を生成する",
    invokeBtn: "儀式を始める", // Cursed time button
    save: "保存",
    saved: "保存済み",
    share: "共有",
    copy: "コピー",
    copied: "コピー完了",
    newStory: "別の恐怖を体験する",
    footer: "© 2024 Kaidan Project. Do not look behind you.",
    terms: "利用規約・免責事項",
    seed: "物語の種（テンプレート）",
    errorGeneric: "深淵を覗き込みすぎました... もう一度お試しください。",
    libraryEmpty: "まだ記録はありません...",
    archiveTitle: "怪談書庫 (Archives)",
    saveLimit: "保存容量が足りません。古い物語を削除してください。",
    audioArchiveNote: "※ アーカイブされた物語の音声は再生されません。",
    tweetText: "恐怖を体験しました...",
    manageSeeds: "編集",
    addSeed: "追加",
    editSeedTitle: "テンプレート編集",
    label: "タイトル",
    prompt: "プロンプト（物語の設定）",
    cancel: "キャンセル",
    delete: "削除",
    notificationTitle: "怪談の生成完了",
    notificationBody: "物語の準備が整いました。深淵を覗く準備はいいですか？",
    hauntedFooter: "後ろを見ないでください...",
    tabTitleHaunted: "見てるよ...",
    tabTitleLeave: "行かないで...",
    noEscape: "逃げられない"
  },
  en: {
    appTitle: "KAIDAN",
    appSubtitle: "Artificial Intelligence Horror Stories",
    inputLabel: "What is your deepest fear?",
    inputPlaceholder: "e.g., An abandoned school, a cursed doll, a stranger in the mirror",
    generateBtn: "GENERATE STORY",
    invokeBtn: "INVOKE RITUAL", // Cursed time button
    save: "Save",
    saved: "Saved",
    share: "Share",
    copy: "Copy",
    copied: "Copied",
    newStory: "Experience Another Horror",
    footer: "© 2024 Kaidan Project. Do not look behind you.",
    terms: "Terms of Service",
    seed: "Story Seeds (Templates)",
    errorGeneric: "You stared too long into the abyss... Please try again.",
    libraryEmpty: "No archives found...",
    archiveTitle: "Horror Archives",
    saveLimit: "Storage limit reached. Please delete old stories.",
    audioArchiveNote: "* Audio is not available for archived stories.",
    tweetText: "I experienced true horror...",
    manageSeeds: "Edit",
    addSeed: "Add",
    editSeedTitle: "Edit Template",
    label: "Label",
    prompt: "Prompt Content",
    cancel: "Cancel",
    delete: "Delete",
    notificationTitle: "Story Ready",
    notificationBody: "Your horror story awaits. Are you brave enough to look?",
    hauntedFooter: "DON'T LOOK BEHIND YOU",
    tabTitleHaunted: "I see you...",
    tabTitleLeave: "Don't leave...",
    noEscape: "NO ESCAPE"
  }
};

const SYSTEM_TEMPLATES = {
  ja: [
    { label: "深夜の廃校", prompt: "深夜の廃校に肝試しに行ったら、音楽室からピアノの音が聞こえてきた..." },
    { label: "日本人形", prompt: "祖母の家で見つけた古い日本人形。翌日になると位置が変わっている気がする..." },
    { label: "真夜中の鏡", prompt: "午前2時に合わせ鏡をすると、自分の死に顔が見えるという噂を試してみた..." },
    { label: "謎の着信", prompt: "亡くなったはずの友人から、毎晩無言電話がかかってくる..." },
    { label: "夜の山道", prompt: "車のナビが示したことのない細い山道に入り込んでしまい、バックミラーに白い何かが..." },
  ],
  en: [
    { label: "Abandoned School", prompt: "I went to an abandoned school at midnight, and heard a piano playing..." },
    { label: "Cursed Doll", prompt: "An old doll found in my grandmother's attic. I swear it moves when I'm not looking..." },
    { label: "Midnight Mirror", prompt: "They say if you look into a mirror at 3 AM, you see your own death..." },
    { label: "Silent Calls", prompt: "I keep getting silent phone calls every night from a friend who died years ago..." },
    { label: "Mountain Road", prompt: "My GPS took me down a narrow mountain road that shouldn't exist..." },
  ]
};

// Cursed words that trigger visual effects in the input
const CURSED_WORDS = [
  'death', 'kill', 'die', 'curse', 'ghost', 'blood', 'murder', 'pain', 'hell', 
  '死', '殺', '呪', '霊', '血', '痛い', '苦しい', '恨'
];

interface CustomTemplate {
  id: string;
  label: string;
  prompt: string;
}

const DEFAULT_PROFILE: UserProfile = {
  username: '',
  language: 'ja',
  intensity: 'standard',
  theme: 'default',
  brightness: 1.0,
  jumpScaresEnabled: false,
  voice: 'Fenrir' // Default voice
};

const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState<StoryState | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  // User Profile State (Consolidated)
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedProfile = localStorage.getItem('kaidan_profile');
        if (savedProfile) {
          return { ...DEFAULT_PROFILE, ...JSON.parse(savedProfile) };
        }
        
        // Migration logic for old keys
        const oldLang = localStorage.getItem('kaidan_language');
        const oldIntensity = localStorage.getItem('kaidan_intensity');
        const oldTheme = localStorage.getItem('kaidan_theme');
        const oldBrightness = localStorage.getItem('kaidan_brightness');
        const oldJumpScares = localStorage.getItem('kaidan_jumpscares');

        if (oldLang || oldIntensity || oldTheme) {
             return {
                 ...DEFAULT_PROFILE,
                 language: (oldLang as Language) || 'ja',
                 intensity: (oldIntensity as HorrorIntensity) || 'standard',
                 theme: (oldTheme as VisualTheme) || 'default',
                 brightness: oldBrightness ? parseFloat(oldBrightness) : 1.0,
                 jumpScaresEnabled: oldJumpScares === 'true'
             };
        }
      } catch (e) {
        console.error("Profile load failed", e);
      }
    }
    return DEFAULT_PROFILE;
  });

  // Persist Profile
  useEffect(() => {
    localStorage.setItem('kaidan_profile', JSON.stringify(profile));
  }, [profile]);

  // Helper setters for SettingsModal
  const setLanguage = (l: Language) => setProfile(p => ({ ...p, language: l }));
  const setBrightness = (b: number) => setProfile(p => ({ ...p, brightness: b }));
  const setJumpScaresEnabled = (e: boolean) => setProfile(p => ({ ...p, jumpScaresEnabled: e }));
  const setIntensity = (i: HorrorIntensity) => setProfile(p => ({ ...p, intensity: i }));
  const setVisualTheme = (t: VisualTheme) => setProfile(p => ({ ...p, theme: t }));
  const setUsername = (u: string) => setProfile(p => ({ ...p, username: u }));
  const setVoice = (v: string) => setProfile(p => ({ ...p, voice: v }));

  const t = TRANSLATIONS[profile.language];

  // Template State
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kaidan_custom_templates');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const [editorState, setEditorState] = useState<{isOpen: boolean, id: string | null, label: string, prompt: string}>({
    isOpen: false,
    id: null,
    label: '',
    prompt: ''
  });

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showJumpScare, setShowJumpScare] = useState(false);
  const [isAnticipating, setIsAnticipating] = useState(false);

  // Library State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [savedStories, setSavedStories] = useState<StoryState[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kaidan_library');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed to load library", e);
        return [];
      }
    }
    return [];
  });

  // Ambient Sound State
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  
  // Hidden Feature States
  const [footerHovered, setFooterHovered] = useState(false);
  const [ghostClicks, setGhostClicks] = useState(0);
  const ghostClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Advanced Hidden Features
  const [bloodMode, setBloodMode] = useState(false); // Konami Code
  const [glitchImage, setGlitchImage] = useState(false); // Image interaction
  const konamiIndex = useRef(0);

  // Check for cursed words in prompt
  const isCursedInput = CURSED_WORDS.some(w => prompt.toLowerCase().includes(w));

  // Determine "Cursed Time" (e.g. any hour : 44 minutes)
  const isCursedTime = () => {
    const min = new Date().getMinutes();
    return min === 44;
  };

  // Update DOM for Anticipation Effect
  useEffect(() => {
    const vignette = document.getElementById('vignette-layer');
    if (vignette) {
      if (isAnticipating) {
        vignette.classList.add('anticipation-active');
      } else {
        vignette.classList.remove('anticipation-active');
      }
    }
  }, [isAnticipating]);

  // Persist library
  useEffect(() => {
    try {
      localStorage.setItem('kaidan_library', JSON.stringify(savedStories));
    } catch (e) {
      console.error("Storage quota exceeded or error saving library", e);
    }
  }, [savedStories]);

  // Persist Custom Templates
  useEffect(() => {
    localStorage.setItem('kaidan_custom_templates', JSON.stringify(customTemplates));
  }, [customTemplates]);

  // Check if current story is saved
  useEffect(() => {
    if (story && story.id) {
      const exists = savedStories.some(s => s.id === story.id);
      setIsSaved(exists);
    } else {
      setIsSaved(false);
    }
  }, [story, savedStories]);
  
  // Use a ref to scroll to story upon generation
  const storyRef = useRef<HTMLDivElement>(null);

  // --- Hidden Element Hooks ---

  // 1. Konami Code Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Basic check to ensure we don't trigger when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
          return;
      }

      if (e.key === KONAMI_CODE[konamiIndex.current]) {
        konamiIndex.current++;
        if (konamiIndex.current === KONAMI_CODE.length) {
          // Trigger Blood Mode
          setBloodMode(prev => !prev);
          konamiIndex.current = 0;
          // Haptic feedback if available
          if (navigator.vibrate) navigator.vibrate([50, 50, 50, 50, 200]);
        }
      } else {
        konamiIndex.current = 0;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Tab Blur/Focus Spook
  useEffect(() => {
    const handleBlur = () => {
        document.title = Math.random() > 0.5 ? t.tabTitleHaunted : t.tabTitleLeave;
    };
    const handleFocus = () => {
        document.title = `${t.appTitle} - AI Horror`;
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
    };
  }, [t]);

  // --- Hidden Element Handlers ---
  const handleGhostClick = () => {
      // Audio feedback for click (subtle thud)
      try {
         const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
         const ctx = new AudioContextClass();
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();
         osc.frequency.value = 50 + (ghostClicks * 10); // Pitch goes up slightly
         osc.type = 'triangle';
         gain.gain.value = 0.05;
         gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
         osc.connect(gain);
         gain.connect(ctx.destination);
         osc.start();
         osc.stop(ctx.currentTime + 0.1);
      } catch(e) {}
  
      setGhostClicks(prev => {
          const newCount = prev + 1;
          if (newCount >= 5) {
              // Trigger Easter Egg
              setShowJumpScare(true);
              return 0;
          }
          return newCount;
      });
  
      if (ghostClickTimer.current) clearTimeout(ghostClickTimer.current);
      ghostClickTimer.current = setTimeout(() => setGhostClicks(0), 800); // Reset if gap > 800ms
  };

  const handleImageClick = () => {
      setGlitchImage(true);
      setTimeout(() => setGlitchImage(false), 300); // Short glitch duration
  };

  // --- Template Handlers ---

  const openTemplateEditor = (template?: CustomTemplate) => {
    if (template) {
      setEditorState({ isOpen: true, id: template.id, label: template.label, prompt: template.prompt });
    } else {
      setEditorState({ isOpen: true, id: null, label: '', prompt: '' });
    }
  };

  const closeTemplateEditor = () => {
    setEditorState({ ...editorState, isOpen: false });
  };

  const saveTemplate = () => {
    if (!editorState.label.trim() || !editorState.prompt.trim()) return;

    if (editorState.id) {
      // Edit existing
      setCustomTemplates(prev => prev.map(t => 
        t.id === editorState.id 
          ? { ...t, label: editorState.label, prompt: editorState.prompt }
          : t
      ));
    } else {
      // Add new
      const newTemplate: CustomTemplate = {
        id: crypto.randomUUID(),
        label: editorState.label,
        prompt: editorState.prompt
      };
      setCustomTemplates(prev => [...prev, newTemplate]);
    }
    closeTemplateEditor();
  };

  const deleteTemplate = (id: string) => {
    if (window.confirm('Delete this template?')) {
      setCustomTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  // --- App Logic ---

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // "RUN" Command Easter Egg
    const lowerPrompt = prompt.trim().toLowerCase();
    if (['run', 'escape', 'help', 'help me', '逃げろ', '助けて', '逃げる'].includes(lowerPrompt)) {
        setPrompt(t.noEscape);
        if (navigator.vibrate) navigator.vibrate(500);
        // Add a visual shake effect logic here if desired, currently handled by prompt state change visible to user
        return;
    }

    // Request Notification permission immediately on user interaction
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    setStatus(AppStatus.GENERATING);
    setErrorMsg(null);
    setAudioData(null); // Reset audio
    setIsSaved(false);

    try {
      // 1. Generate Story first (with Language and Username)
      const generatedStory = await generateHorrorStory(prompt, profile.intensity, profile.language, profile.username);
      
      // 2. Generate Image and Audio in parallel
      const imagePromise = generatedStory.imagePrompt 
        ? generateHorrorImage(generatedStory.imagePrompt) 
        : Promise.resolve("");
      
      // Pass language AND voice to speech gen
      const audioPromise = generateHorrorSpeech(generatedStory.content, profile.language, profile.voice)
        .catch(err => {
            console.warn("Audio generation failed", err);
            return null;
        });

      const [base64Image, base64Audio] = await Promise.all([imagePromise, audioPromise]);

      const newStory: StoryState = {
        ...generatedStory,
        imageUrl: base64Image,
        id: crypto.randomUUID(), // Assign ID immediately
        createdAt: Date.now(),
        language: profile.language
      };

      setStory(newStory);
      
      if (base64Audio) {
        setAudioData(base64Audio);
      }

      setStatus(AppStatus.IDLE);
      
      // Send notification if generation is complete and user might be tabbed away
      if ("Notification" in window && Notification.permission === "granted" && document.visibilityState === 'hidden') {
         new Notification(t.notificationTitle, {
             body: t.notificationBody,
             // Optional: add an icon path if available
         });
      }
      
      // Small timeout to allow render before scroll
      setTimeout(() => {
        storyRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setErrorMsg(err.message || t.errorGeneric);
    }
  };

  const resetApp = () => {
    setStory(null);
    setPrompt('');
    setAudioData(null);
    setStatus(AppStatus.IDLE);
    setShowJumpScare(false);
    setIsAnticipating(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveStory = () => {
    if (!story) return;
    
    // Check duplication
    if (savedStories.some(s => s.id === story.id)) {
        return;
    }

    try {
      const newLibrary = [story, ...savedStories];
      localStorage.setItem('kaidan_library', JSON.stringify(newLibrary));
      setSavedStories(newLibrary);
      setIsSaved(true);
    } catch (e) {
      alert(t.saveLimit);
    }
  };

  const handleDeleteStory = (id: string) => {
    const newLibrary = savedStories.filter(s => s.id !== id);
    setSavedStories(newLibrary);
    if (story?.id === id) {
      setIsSaved(false);
    }
  };

  const handleSelectStoryFromLibrary = (selectedStory: StoryState) => {
    setStory(selectedStory);
    setAudioData(null); 
    setIsLibraryOpen(false);
    setTimeout(() => {
        storyRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleFeedbackSubmit = (rating: 'up' | 'down', text: string) => {
    console.log("Feedback submitted:", {
        storyTitle: story?.title,
        rating,
        feedbackText: text,
        timestamp: new Date().toISOString()
    });
  };

  // Theme Styles Configuration
  const themeStyles = {
    default: {
      container: 'bg-gradient-to-b from-transparent via-black/20 to-transparent border-red-900/30',
      title: 'text-red-700 font-serif font-bold tracking-wider drop-shadow-md',
      text: 'text-gray-300 font-serif',
      button: 'bg-gray-900/50 hover:bg-red-900/30 text-gray-400 hover:text-white border-gray-800 hover:border-red-800'
    },
    tombstone: {
      container: 'bg-zinc-900 border-stone-600 rounded-sm shadow-2xl',
      title: 'text-stone-300 font-serif tracking-widest uppercase',
      text: 'text-stone-400 font-sans leading-loose',
      button: 'bg-zinc-800 hover:bg-zinc-700 text-stone-400 hover:text-stone-200 border-zinc-600 hover:border-stone-400'
    },
    parchment: {
      container: 'bg-[#1a1814] border-[#5d4037] rounded-sm shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]',
      title: 'text-[#d7ccc8] font-serif italic',
      text: 'text-[#a1887f] font-serif leading-relaxed',
      button: 'bg-[#2d241e] hover:bg-[#3e2723] text-[#a1887f] hover:text-[#d7ccc8] border-[#4e342e] hover:border-[#8d6e63]'
    },
    asylum: {
      container: 'bg-slate-900 border-teal-900/40 rounded-sm shadow-[0_0_15px_rgba(20,83,45,0.2)]',
      title: 'text-teal-200/80 font-mono tracking-tighter',
      text: 'text-teal-400/70 font-mono',
      button: 'bg-slate-950 hover:bg-teal-900/20 text-teal-600 hover:text-teal-200 border-teal-900/30 hover:border-teal-500/30'
    }
  };

  const currentTheme = themeStyles[profile.theme];

  const getShareDefaultText = () => {
      if (!story) return "";
      return `${story.title}\n\n${t.tweetText} #KaidanAI #Horror`;
  };

  return (
    <div className={`min-h-screen text-gray-300 selection:bg-red-900 selection:text-white pb-20 relative transition-colors duration-500 ${profile.language === 'en' ? 'font-sans' : 'font-serif'}`}>
      
      {/* Blood Mode Overlay (Konami Code) */}
      {bloodMode && (
          <div className="fixed inset-0 z-[60] pointer-events-none bg-red-900 opacity-20 mix-blend-color-burn animate-pulse"></div>
      )}
      
      {/* Top Right Navigation */}
      <div className="fixed top-6 right-6 z-30 flex flex-col gap-4">
        <button 
          onClick={resetApp}
          className="text-gray-400 hover:text-white hover:bg-red-900/50 transition-all p-3 rounded-full backdrop-blur-sm bg-black/20 border border-transparent hover:border-red-900/30"
          aria-label={t.newStory}
          title={t.newStory}
        >
          <Plus size={28} />
        </button>

        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="text-gray-400 hover:text-white hover:bg-red-900/50 transition-all p-3 rounded-full backdrop-blur-sm bg-black/20 border border-transparent hover:border-red-900/30"
          aria-label="Settings"
        >
          <Settings size={28} />
        </button>

        <button 
          onClick={() => setIsLibraryOpen(true)}
          className="text-gray-400 hover:text-white hover:bg-blue-900/50 transition-all p-3 rounded-full backdrop-blur-sm bg-black/20 border border-transparent hover:border-blue-900/30"
          aria-label="Library"
        >
          <BookOpen size={28} />
        </button>
      </div>

      {/* Ambient Sound Toggle (Fixed Bottom Right) */}
      <AmbientSound isPlaying={isAmbientPlaying} toggle={() => setIsAmbientPlaying(!isAmbientPlaying)} />

      {/* Jump Scare Overlay */}
      {showJumpScare && <JumpScare intensity={profile.intensity} onComplete={() => setShowJumpScare(false)} />}

      {/* Loading Overlay */}
      {status === AppStatus.GENERATING && <LoadingScreen />}

      {/* Main Content (Affected by Brightness) */}
      <div style={{ filter: `brightness(${profile.brightness})` }} className="transition-[filter] duration-300">
        <main className="container mx-auto px-4 pt-16 md:pt-24 max-w-3xl relative z-10">
          
          {/* Header */}
          <header className="text-center mb-12">
            <div 
              className={`inline-block mb-4 transition-transform duration-100 ${ghostClicks > 0 ? 'scale-110' : ''}`}
              onClick={handleGhostClick}
              role="button"
              tabIndex={0}
              title="..."
            >
              <Ghost size={48} className={`text-red-700 opacity-80 ${ghostClicks > 0 ? 'animate-pulse' : ''}`} />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-100 to-gray-600 mb-2 font-serif tracking-widest">
              <GlitchText text={t.appTitle} intensity="high" />
            </h1>
            <p className="text-red-900/80 text-sm md:text-base tracking-[0.2em] font-serif uppercase">
              {t.appSubtitle}
            </p>
          </header>

          {/* Input Form (Hidden if story exists) */}
          {!story && (
            <div className={`bg-gray-950/50 border p-8 rounded-sm shadow-2xl backdrop-blur-sm transition-all duration-500 ${isCursedInput ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-900 hover:border-red-900/30'}`}>
              
              {/* Story Templates (Seeds) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-serif tracking-widest">
                        <Sparkles size={12} className="text-yellow-600/70" />
                        <span>{t.seed}</span>
                    </div>
                    
                    <button 
                        onClick={() => setIsManagingTemplates(!isManagingTemplates)}
                        className={`text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded-sm ${isManagingTemplates ? 'text-red-400 bg-red-900/20' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                       <Edit2 size={10} />
                       {t.manageSeeds}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* System Templates (Fixed) */}
                  {SYSTEM_TEMPLATES[profile.language].map((template, i) => (
                    <button
                      key={`sys-${i}`}
                      type="button"
                      disabled={isManagingTemplates} // Disable system templates during edit mode
                      onClick={() => setPrompt(template.prompt)}
                      className={`text-xs px-3 py-1.5 border transition-all rounded-sm font-serif ${
                         isManagingTemplates 
                         ? 'bg-gray-900 border-gray-800 text-gray-600 opacity-50 cursor-not-allowed' 
                         : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-gray-800'
                      }`}
                    >
                      {template.label}
                    </button>
                  ))}

                  {/* Custom Templates (Editable) */}
                  {customTemplates.map((template) => (
                    <div key={template.id} className="relative group">
                        <button
                            type="button"
                            onClick={() => {
                                if (isManagingTemplates) {
                                    openTemplateEditor(template);
                                } else {
                                    setPrompt(template.prompt);
                                }
                            }}
                            className={`text-xs px-3 py-1.5 border transition-all rounded-sm font-serif pr-6 relative ${
                                isManagingTemplates
                                ? 'bg-indigo-900/20 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/40 cursor-pointer'
                                : 'bg-indigo-950/30 border-indigo-900/50 text-indigo-200/80 hover:text-indigo-100 hover:border-indigo-700 hover:bg-indigo-900/30'
                            }`}
                        >
                            {template.label}
                            {isManagingTemplates && (
                                <span className="absolute right-1 top-1/2 -translate-y-1/2 opacity-50">
                                    <PenTool size={8} />
                                </span>
                            )}
                        </button>
                        
                        {/* Delete Button (Only in Manage Mode) */}
                        {isManagingTemplates && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTemplate(template.id);
                                }}
                                className="absolute -top-2 -right-1 bg-red-900 text-white rounded-full p-0.5 hover:bg-red-700 shadow-md transform scale-0 group-hover:scale-100 transition-transform"
                                title={t.delete}
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>
                  ))}

                  {/* Add New Template Button */}
                  {isManagingTemplates && (
                      <button
                        type="button"
                        onClick={() => openTemplateEditor()}
                        className="text-xs px-3 py-1.5 bg-gray-900/50 border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 hover:bg-gray-800 transition-all rounded-sm font-serif flex items-center gap-1"
                      >
                        <Plus size={10} />
                        {t.addSeed}
                      </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleGenerate} className="flex flex-col gap-6">
                <div>
                  <label htmlFor="fear-input" className={`block text-sm mb-2 tracking-wider transition-colors ${isCursedInput ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
                    {t.inputLabel}
                  </label>
                  <input
                    id="fear-input"
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.inputPlaceholder}
                    className={`w-full bg-black border-b text-xl py-3 px-2 focus:outline-none transition-all placeholder-gray-800 text-gray-200 ${
                        isCursedInput 
                        ? 'border-red-600 text-red-500 bg-red-950/10 animate-[pulse_2s_infinite]' 
                        : 'border-gray-800 focus:border-red-800 focus:bg-gray-900/30'
                    }`}
                    autoComplete="off"
                  />
                </div>

                {status === AppStatus.ERROR && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 mb-6 p-4 bg-red-950/30 border-l-2 border-red-600 border-y border-r border-gray-900/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-900/5 pointer-events-none animate-pulse"></div>
                    <div className="flex items-start gap-3 relative z-10">
                      <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-red-800 uppercase tracking-widest mb-1 font-bold">
                           {profile.language === 'ja' ? 'システムエラー' : 'SYSTEM FAILURE'}
                        </span>
                        <p className="text-sm text-red-300 font-serif leading-relaxed drop-shadow-sm">
                           {errorMsg}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === AppStatus.GENERATING || !prompt.trim()}
                  className={`group relative px-6 py-4 mt-4 bg-black border border-gray-800 uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
                      isCursedTime() 
                      ? 'text-red-600 border-red-900 hover:text-red-400 hover:border-red-600' 
                      : 'text-gray-400 hover:text-red-500 hover:border-red-900'
                  }`}
                >
                  <span className={`relative z-10 group-hover:animate-pulse ${isCursedTime() ? 'font-bold' : ''}`}>
                      {isCursedTime() ? t.invokeBtn : t.generateBtn}
                  </span>
                  <div className="absolute inset-0 bg-red-900/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                </button>
              </form>
            </div>
          )}

          {/* Story Display */}
          {story && (
            <div ref={storyRef} className="animate-[fadeIn_2s_ease-out]">
              <div className={`border-t border-b py-12 px-4 md:px-10 relative transition-all duration-700 ${currentTheme.container}`}>
                
                {/* Generated Image */}
                {story.imageUrl && (
                  <div 
                    onClick={handleImageClick}
                    className={`mb-10 relative group overflow-hidden border shadow-2xl cursor-pointer ${
                      profile.theme === 'asylum' ? 'border-teal-900/40' : 
                      profile.theme === 'parchment' ? 'border-[#5d4037]/50' : 
                      'border-gray-900'
                  }`}>
                    <div className="absolute inset-0 bg-black/10 z-10 mix-blend-overlay pointer-events-none"></div>
                    <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] z-20 pointer-events-none"></div>
                    <img 
                      src={`data:image/jpeg;base64,${story.imageUrl}`} 
                      alt="Horror scene" 
                      className={`w-full h-auto object-cover transition-all duration-[2s] ease-out filter ${
                          glitchImage ? 'invert hue-rotate-180 brightness-150 contrast-200' : ''
                      } ${
                          profile.theme === 'tombstone' ? 'grayscale contrast-125' :
                          profile.theme === 'parchment' ? 'sepia-[0.6] contrast-100 brightness-75' :
                          profile.theme === 'asylum' ? 'hue-rotate-[170deg] grayscale-[0.5] contrast-125' :
                          'sepia-[0.3] contrast-125 grayscale-[0.3] opacity-80 group-hover:opacity-100 group-hover:scale-105'
                      }`}
                    />
                  </div>
                )}

                {/* Title */}
                <h2 className={`text-3xl md:text-4xl mb-8 text-center leading-relaxed drop-shadow-md transition-colors ${currentTheme.title}`}>
                  {story.title}
                </h2>

                {/* Story Text */}
                <div className={`prose prose-lg max-w-none whitespace-pre-wrap text-justify transition-colors ${currentTheme.text}`}>
                  {story.content}
                </div>

                {/* Audio Player */}
                <AudioPlayer 
                  base64Audio={audioData} 
                  autoPlay={!!audioData} 
                  jumpScareTiming={story.jumpScareTiming}
                  jumpScaresEnabled={profile.jumpScaresEnabled}
                  onJumpScareTrigger={() => setShowJumpScare(true)}
                  onAnticipation={(active) => setIsAnticipating(active)}
                />
                {!audioData && isSaved && (
                   <p className="text-xs text-gray-600 mt-2 text-center font-serif">{t.audioArchiveNote}</p>
                )}
                
                {/* Share/Save Section */}
                <div className={`mt-8 pt-6 border-t flex flex-wrap justify-center gap-4 transition-colors ${
                    profile.theme === 'parchment' ? 'border-[#5d4037]/30' : 
                    profile.theme === 'tombstone' ? 'border-zinc-700' :
                    profile.theme === 'asylum' ? 'border-teal-900/30' :
                    'border-gray-900'
                }`}>
                  <button
                    onClick={handleSaveStory}
                    disabled={isSaved}
                    className={`flex items-center gap-2 px-6 py-3 rounded-sm border text-sm transition-all duration-300 ${
                        isSaved 
                        ? 'opacity-50 cursor-default ' + currentTheme.button 
                        : currentTheme.button
                    }`}
                    title={isSaved ? t.saved : t.save}
                  >
                    {isSaved ? <Check size={16} /> : <Save size={16} />}
                    <span>{isSaved ? t.saved : t.save}</span>
                  </button>

                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-sm border text-sm transition-colors ${currentTheme.button}`}
                    title={t.share}
                  >
                    <Share2 size={16} />
                    <span>{t.share}</span>
                  </button>
                </div>

                {/* Feedback Section */}
                <Feedback onSubmit={handleFeedbackSubmit} key={story.title} />

              </div>

              {/* Reset Button */}
              <div className="mt-12 text-center">
                <button
                  onClick={resetApp}
                  className="flex items-center gap-2 mx-auto text-gray-600 hover:text-red-500 transition-colors duration-300 uppercase text-sm tracking-widest"
                >
                  <RefreshCw size={16} />
                  <span>{t.newStory}</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-24 text-center text-gray-800 text-xs font-serif flex flex-col items-center gap-2">
            <p 
              className={`transition-all duration-500 cursor-default ${footerHovered ? 'text-red-800 tracking-[0.3em] font-bold scale-110' : ''}`}
              onMouseEnter={() => setFooterHovered(true)}
              onMouseLeave={() => setFooterHovered(false)}
            >
              {footerHovered ? t.hauntedFooter : t.footer}
            </p>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-red-800 underline decoration-gray-800 underline-offset-4 transition-colors"
            >
              {t.terms}
            </button>
          </footer>

        </main>
      </div>

      {/* Settings Modal (Outside brightness filter) */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        brightness={profile.brightness}
        setBrightness={setBrightness}
        jumpScaresEnabled={profile.jumpScaresEnabled}
        setJumpScaresEnabled={setJumpScaresEnabled}
        intensity={profile.intensity}
        setIntensity={setIntensity}
        visualTheme={profile.theme}
        setVisualTheme={setVisualTheme}
        language={profile.language}
        setLanguage={setLanguage}
        username={profile.username}
        setUsername={setUsername}
        voice={profile.voice}
        setVoice={setVoice}
      />

      {/* Library Modal */}
      <StoryLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        stories={savedStories}
        onSelect={handleSelectStoryFromLibrary}
        onDelete={handleDeleteStory}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        defaultText={getShareDefaultText()}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />

      {/* Template Editor Modal */}
      {editorState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeTemplateEditor} />
            <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 p-6 shadow-2xl animate-in zoom-in duration-200 rounded-sm">
                <button 
                    onClick={closeTemplateEditor}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-300"
                >
                    <X size={20} />
                </button>
                
                <h3 className="text-lg font-serif font-bold text-gray-200 mb-6 flex items-center gap-2">
                    <Edit2 size={16} className="text-indigo-400" />
                    {t.editSeedTitle}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">{t.label}</label>
                        <input 
                            type="text" 
                            value={editorState.label}
                            onChange={(e) => setEditorState({...editorState, label: e.target.value})}
                            className="w-full bg-gray-950 border border-gray-700 p-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none rounded-sm"
                            placeholder="Template Name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">{t.prompt}</label>
                        <textarea 
                            value={editorState.prompt}
                            onChange={(e) => setEditorState({...editorState, prompt: e.target.value})}
                            className="w-full bg-gray-950 border border-gray-700 p-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none rounded-sm h-32 resize-none"
                            placeholder="Horror story prompt..."
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button 
                            onClick={closeTemplateEditor}
                            className="flex-1 py-2 border border-gray-700 text-gray-400 hover:bg-gray-800 rounded-sm text-sm"
                        >
                            {t.cancel}
                        </button>
                        <button 
                            onClick={saveTemplate}
                            disabled={!editorState.label.trim() || !editorState.prompt.trim()}
                            className="flex-1 py-2 bg-indigo-900/40 border border-indigo-700 text-indigo-200 hover:bg-indigo-900/60 rounded-sm text-sm disabled:opacity-50"
                        >
                            {t.save}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;