import React, { useState, useEffect } from 'react';
import { X, Sun, FileText, Zap, ZapOff, Skull, Ghost, AlertOctagon, Palette, Scroll, Landmark, Languages, User, Mic, Play, Loader2, LogOut } from 'lucide-react';
import { HorrorIntensity, VisualTheme, Language, UserProfile } from '../types';
import { generateHorrorSpeech } from '../services/geminiService';
import { loginWithGoogle, logout } from '../services/firebase';
import { decode, decodeAudioData } from '../services/audioUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brightness: number;
  setBrightness: (val: number) => void;
  jumpScaresEnabled: boolean;
  setJumpScaresEnabled: (enabled: boolean) => void;
  intensity: HorrorIntensity;
  setIntensity: (intensity: HorrorIntensity) => void;
  visualTheme: VisualTheme;
  setVisualTheme: (theme: VisualTheme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  username: string;
  setUsername: (name: string) => void;
  voice: string;
  setVoice: (voice: string) => void;
  profile?: UserProfile;
}

const VOICE_OPTIONS = [
  { 
    id: 'Fenrir', 
    label: { en: 'Fenrir', ja: 'フェンリル' }, 
    desc: { en: 'Deep / Intense', ja: '重厚 / 激しい' }, 
    gender: 'Male' 
  },
  { 
    id: 'Charon', 
    label: { en: 'Charon', ja: 'カロン' }, 
    desc: { en: 'Low / Authoritative', ja: '低音 / 威圧的' }, 
    gender: 'Male' 
  },
  { 
    id: 'Kore', 
    label: { en: 'Kore', ja: 'コレ' }, 
    desc: { en: 'Calm / Clear', ja: '静寂 / 明瞭' }, 
    gender: 'Female' 
  },
  { 
    id: 'Puck', 
    label: { en: 'Puck', ja: 'パック' }, 
    desc: { en: 'Neutral / Tenor', ja: '中性的 / 高音' }, 
    gender: 'Male' 
  },
  { 
    id: 'Zephyr', 
    label: { en: 'Zephyr', ja: 'ゼファー' }, 
    desc: { en: 'Soft / Gentle', ja: '柔和 / 優しい' }, 
    gender: 'Female' 
  },
  { 
    id: 'Aoede', 
    label: { en: 'Aoede', ja: 'アオエデ' }, 
    desc: { en: 'Confident / Proud', ja: '自信 / 誇り' }, 
    gender: 'Female' 
  },
  // Expanded Voices
  { 
    id: 'Orion', 
    label: { en: 'The Narrator', ja: '語り部' }, 
    desc: { en: 'Dry / Academic', ja: '淡々 / 学術的' }, 
    gender: 'Male' 
  },
  { 
    id: 'Lyra', 
    label: { en: 'The Child', ja: '子供' }, 
    desc: { en: 'Innocent / Chilling', ja: '無垢 / 不気味' }, 
    gender: 'Female' 
  },
  { 
    id: 'Ursa', 
    label: { en: 'The Ancient One', ja: '古の者' }, 
    desc: { en: 'Deep / Resonant', ja: '深淵 / 響き' }, 
    gender: 'Male' 
  },
];

// Audio Cache to prevent regenerating the same sample repeatedly
const audioCache: Record<string, AudioBuffer> = {};

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  brightness, 
  setBrightness,
  jumpScaresEnabled,
  setJumpScaresEnabled,
  intensity,
  setIntensity,
  visualTheme,
  setVisualTheme,
  language,
  setLanguage,
  username,
  setUsername,
  voice,
  setVoice,
  profile
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Stop audio when modal closes
  useEffect(() => {
    if (!isOpen) {
        setPlayingVoiceId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isJa = language === 'ja';
  const isLoggedIn = !!profile?.uid;

  // Localized Labels
  const THEME_LABELS = {
    default: { en: 'Default', ja: '標準' },
    tombstone: { en: 'Tombstone', ja: '墓標' },
    parchment: { en: 'Parchment', ja: '古文書' },
    asylum: { en: 'Asylum', ja: '廃病棟' }
  };

  const handlePlaySample = async (e: React.MouseEvent, voiceId: string) => {
      e.stopPropagation();
      if (playingVoiceId) return; // Prevent multiple plays

      setPlayingVoiceId(voiceId);
      setVoice(voiceId); // Select the voice as well

      try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

          // Check Cache First
          if (audioCache[voiceId]) {
              const source = ctx.createBufferSource();
              source.buffer = audioCache[voiceId];
              source.connect(ctx.destination);
              source.onended = () => {
                  setPlayingVoiceId(null);
                  ctx.close();
              };
              source.start();
              return;
          }

          // If not cached, generate
          const sampleText = isJa ? "声のサンプルです。" : "Voice sample.";
          const base64 = await generateHorrorSpeech(sampleText, language, voiceId);
          
          const bytes = decode(base64);
          const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
          
          // Save to cache
          audioCache[voiceId] = buffer;
          
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          
          source.onended = () => {
              setPlayingVoiceId(null);
              ctx.close();
          };
          
          source.start();

      } catch (err) {
          console.error("Failed to play sample", err);
          setPlayingVoiceId(null);
      }
  };

  const handleLogin = async () => {
      setIsAuthLoading(true);
      try {
          await loginWithGoogle();
      } catch (e) {
          alert("Login failed. Please check console or config.");
      } finally {
          setIsAuthLoading(false);
      }
  };

  const handleLogout = async () => {
      setIsAuthLoading(true);
      try {
          await logout();
      } catch (e) {
          console.error(e);
      } finally {
          setIsAuthLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 p-6 shadow-2xl animate-in fade-in zoom-in duration-300 rounded-sm overflow-y-auto max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2"
          aria-label="Close settings"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-sans font-bold text-gray-100 mb-6 tracking-wide flex items-center gap-2 border-b border-gray-800 pb-4">
          <SettingsIcon />
          <span>{isJa ? "設定 / Settings" : "Settings"}</span>
        </h2>
        
        {/* Username / Authentication */}
        <div className="mb-8 p-4 bg-gray-950/50 border border-gray-800 rounded-md">
            <label className="flex items-center gap-2 text-gray-200 mb-4 text-base font-medium">
                <User size={20} className="text-indigo-500" />
                <span>{isJa ? "ユーザー (Account)" : "User Account"}</span>
            </label>

            {isLoggedIn ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {profile?.photoURL ? (
                            <img src={profile.photoURL} alt="User" className="w-10 h-10 rounded-full border border-gray-600" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold">
                                {profile?.username?.charAt(0) || "?"}
                            </div>
                        )}
                        <div>
                            <p className="text-gray-200 font-bold">{profile?.username}</p>
                            <p className="text-xs text-gray-500">{profile?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={isAuthLoading}
                        className="text-xs px-3 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded hover:bg-red-900/40 transition-colors flex items-center gap-1"
                    >
                        {isAuthLoading ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                        {isJa ? "ログアウト" : "Sign Out"}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                         <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={isJa ? "名前を入力 (ゲスト)..." : "Enter name (Guest)..."}
                            className="w-full bg-gray-800 border border-gray-700 p-3 rounded-md text-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                        <p className="text-xs text-gray-500">
                             {isJa ? "ゲストとして利用するか、Googleでログインして体験を保存してください。" : "Use as guest or login to save your experience."}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 my-2">
                        <div className="h-px bg-gray-800 flex-1"></div>
                        <span className="text-xs text-gray-600">OR</span>
                        <div className="h-px bg-gray-800 flex-1"></div>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={isAuthLoading}
                        className="w-full py-3 bg-white text-gray-900 font-bold rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                        {isAuthLoading ? (
                             <Loader2 size={18} className="animate-spin" />
                        ) : (
                             <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                        )}
                        {isJa ? "Googleでログイン" : "Sign in with Google"}
                    </button>
                </div>
            )}
        </div>

        {/* Language Selector */}
        <div className="mb-8">
            <label className="flex items-center gap-2 text-gray-200 mb-3 text-base font-medium">
                <Languages size={20} className="text-pink-500" />
                <span>{isJa ? "言語 (Language)" : "Language"}</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setLanguage('ja')}
                    className={`px-4 py-3 rounded-md border font-serif transition-all ${
                        language === 'ja'
                        ? 'bg-pink-900/30 border-pink-500 text-pink-100' 
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    日本語 (Japanese)
                </button>
                <button
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-3 rounded-md border font-sans transition-all ${
                        language === 'en'
                        ? 'bg-pink-900/30 border-pink-500 text-pink-100' 
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    English
                </button>
            </div>
        </div>

        {/* Voice Selector */}
        <div className="mb-8">
            <label className="flex items-center gap-2 text-gray-200 mb-3 text-base font-medium">
                <Mic size={20} className="text-orange-500" />
                <span>{isJa ? "語り手 (Narrator Voice)" : "Narrator Voice"}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VOICE_OPTIONS.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setVoice(v.id)}
                        className={`relative flex flex-col items-center justify-center p-2 rounded-md border text-sm transition-all group overflow-hidden ${
                            voice === v.id
                            ? 'bg-orange-900/30 border-orange-500 text-orange-100'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        <span className="font-bold z-10">{isJa ? v.label.ja : v.label.en}</span>
                        <span className="text-[10px] opacity-70 z-10">{isJa ? v.desc.ja : v.desc.en}</span>
                        
                        {/* Play Sample Button */}
                        <div 
                           className="mt-1 z-20"
                           onClick={(e) => handlePlaySample(e, v.id)}
                        >
                             {playingVoiceId === v.id ? (
                                 <Loader2 size={14} className="animate-spin text-orange-300" />
                             ) : (
                                 <Play size={14} className="text-gray-500 hover:text-orange-300 transition-colors" />
                             )}
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Jump Scare Toggle */}
        <div className="mb-6 p-4 bg-red-950/20 border border-red-900/30 rounded-md">
            <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-red-200 font-medium">
                    {jumpScaresEnabled ? <Zap size={20} className="text-red-500" /> : <ZapOff size={20} className="text-gray-500" />}
                    <span>{isJa ? "ジャンプスケア (恐怖演出)" : "Jump Scares"}</span>
                </label>
                
                <button 
                    onClick={() => setJumpScaresEnabled(!jumpScaresEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${jumpScaresEnabled ? 'bg-red-600' : 'bg-gray-700'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${jumpScaresEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            <p className="text-xs text-gray-400">
                {isJa 
                  ? "有効にすると、物語のクライマックスで突発的な音と映像の演出が発生します。"
                  : "Enables sudden audio-visual scares during the climax of the story."}
            </p>
        </div>

        {/* Horror Intensity Selector */}
        <div className="mb-6">
            <label className="flex items-center gap-2 text-gray-200 mb-3 text-base font-medium">
                <Skull size={20} className="text-purple-500" />
                <span>{isJa ? "恐怖レベル (Horror Intensity)" : "Horror Intensity"}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => setIntensity('mild')}
                    className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${
                        intensity === 'mild' 
                        ? 'bg-blue-900/30 border-blue-500 text-blue-100' 
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    <Ghost size={24} className="mb-1" />
                    <span className="text-xs font-bold">Mild</span>
                    <span className="text-[10px] opacity-70">{isJa ? "控えめ" : "Light"}</span>
                </button>

                <button
                    onClick={() => setIntensity('standard')}
                    className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${
                        intensity === 'standard' 
                        ? 'bg-gray-700 border-gray-400 text-white' 
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    <Skull size={24} className="mb-1" />
                    <span className="text-xs font-bold">Standard</span>
                    <span className="text-[10px] opacity-70">{isJa ? "標準" : "Normal"}</span>
                </button>

                <button
                    onClick={() => setIntensity('extreme')}
                    className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${
                        intensity === 'extreme' 
                        ? 'bg-red-900/40 border-red-500 text-red-100 animate-[pulse_3s_infinite]' 
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    <AlertOctagon size={24} className="mb-1" />
                    <span className="text-xs font-bold">Extreme</span>
                    <span className="text-[10px] opacity-70">{isJa ? "極限" : "Max"}</span>
                </button>
            </div>
        </div>

        {/* Visual Theme Selector */}
        <div className="mb-8">
            <label className="flex items-center gap-2 text-gray-200 mb-3 text-base font-medium">
                <Palette size={20} className="text-emerald-500" />
                <span>{isJa ? "表示テーマ (Theme)" : "Visual Theme"}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'default', label: 'Default', icon: <Ghost size={16} /> },
                  { id: 'tombstone', label: 'Tombstone', icon: <Landmark size={16} /> },
                  { id: 'parchment', label: 'Parchment', icon: <Scroll size={16} /> },
                  { id: 'asylum', label: 'Asylum', icon: <AlertOctagon size={16} /> }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setVisualTheme(t.id as VisualTheme)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all ${
                        visualTheme === t.id 
                        ? 'bg-emerald-900/30 border-emerald-500 text-emerald-100' 
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {t.icon}
                    <span>{isJa ? THEME_LABELS[t.id as keyof typeof THEME_LABELS].ja : t.label}</span>
                  </button>
                ))}
            </div>
        </div>

        {/* Brightness Control */}
        <div className="mb-8">
          <label className="flex items-center gap-2 text-gray-200 mb-3 text-base font-medium">
            <Sun size={20} className="text-yellow-500" />
            <span>{isJa ? "画面の明るさ (Brightness)" : "Brightness"}</span>
          </label>
          <div className="bg-gray-800 p-4 rounded-md">
            <div className="relative h-6 flex items-center">
               <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600 hover:accent-red-500 focus:outline-none focus:ring-2 focus:ring-red-900"
                />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-3 font-sans">
              <span>Dark</span>
              <span>Standard</span>
              <span>Bright</span>
            </div>
          </div>
        </div>

        {/* Terms of Service */}
        <div>
          <div className="flex items-center gap-2 text-gray-200 mb-3 text-base font-medium">
             <FileText size={20} className="text-blue-400" />
             <span>{isJa ? "利用規約・免責事項" : "Terms & Disclaimer"}</span>
          </div>
          <div className="h-48 overflow-y-auto text-sm text-gray-300 space-y-3 p-4 bg-gray-950 border border-gray-700 rounded-md leading-relaxed scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {isJa ? (
                <>
                <p><strong className="text-white">1. コンテンツについて</strong><br/>本アプリケーション「怪談 (Kaidan)」は、生成AIを使用してホラー小説を作成します。生成される内容は架空のものであり、実在の人物・団体・事件とは一切関係ありません。</p>
                <p><strong className="text-white">2. 健康への影響</strong><br/>本サイトには、点滅する光（明滅表現）や不安を煽る表現、急激な音響変化が含まれる場合があります。光過敏性発作の既往歴がある方、心臓の弱い方、その他健康に不安のある方は利用をお控えください。</p>
                <p><strong className="text-white">3. 免責事項</strong><br/>本サイトの利用により生じた精神的苦痛、体調不良、その他の損害について、開発者は一切の責任を負いません。ご利用は自己責任でお願いいたします。</p>
                <p><strong className="text-white">4. データの取り扱い</strong><br/>入力されたプロンプトは、物語生成のためにGoogle Gemini APIに送信されます。個人情報や機密情報は入力しないようお願いいたします。</p>
                </>
            ) : (
                <>
                <p><strong className="text-white">1. Content</strong><br/>This application uses AI to generate horror stories. All content is fictional.</p>
                <p><strong className="text-white">2. Health Warning</strong><br/>This site contains flashing lights, unsettling imagery, and sudden loud noises. Users with a history of photosensitive seizures or heart conditions should avoid this application.</p>
                <p><strong className="text-white">3. Disclaimer</strong><br/>The developer is not responsible for any distress or health issues caused by using this site. Use at your own risk.</p>
                <p><strong className="text-white">4. Data Privacy</strong><br/>Prompts are sent to Google Gemini API. Please do not input personal or confidential information.</p>
                </>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

// Simple Icon component
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

export default SettingsModal;