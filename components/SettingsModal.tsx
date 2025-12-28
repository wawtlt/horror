import React from 'react';
import { X, Sun, FileText, Zap, ZapOff, Skull, Ghost, AlertOctagon, Palette, Scroll, Landmark, Languages, User, Mic } from 'lucide-react';
import { HorrorIntensity, VisualTheme, Language } from '../types';

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
}

const VOICE_OPTIONS = [
  { id: 'Fenrir', label: 'Fenrir', desc: 'Deep / Intense', gender: 'Male' },
  { id: 'Charon', label: 'Charon', desc: 'Low / Authoritative', gender: 'Male' },
  { id: 'Kore', label: 'Kore', desc: 'Calm / Clear', gender: 'Female' },
  { id: 'Puck', label: 'Puck', desc: 'Neutral / Tenor', gender: 'Male' },
  { id: 'Zephyr', label: 'Zephyr', desc: 'Soft / Gentle', gender: 'Female' },
  { id: 'Aoede', label: 'Aoede', desc: 'Confident / Proud', gender: 'Female' },
];

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
  setVoice
}) => {
  if (!isOpen) return null;

  const isJa = language === 'ja';

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
        
        {/* Username Input */}
        <div className="mb-8">
            <label className="flex items-center gap-2 text-gray-200 mb-3 text-base font-medium">
                <User size={20} className="text-indigo-500" />
                <span>{isJa ? "ユーザー名 (Name)" : "Your Name"}</span>
            </label>
            <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isJa ? "物語に登場する名前を入力..." : "Enter name for story personalization..."}
                className="w-full bg-gray-800 border border-gray-700 p-3 rounded-md text-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-2">
                {isJa 
                 ? "※ 入力すると、物語の中であなたの名前が呼ばれることがあります。" 
                 : "* If entered, your name may appear in the stories for immersion."}
            </p>
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
                        className={`flex flex-col items-center justify-center p-2 rounded-md border text-sm transition-all ${
                            voice === v.id
                            ? 'bg-orange-900/30 border-orange-500 text-orange-100'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        <span className="font-bold">{v.label}</span>
                        <span className="text-[10px] opacity-70">{v.desc}</span>
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
                    <span>{t.label}</span>
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