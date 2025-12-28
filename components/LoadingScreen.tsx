import React, { useEffect, useState } from 'react';
import { Skull } from 'lucide-react';

const messages = [
  "霊を呼んでいます...",
  "記憶を掘り起こしています...",
  "後ろを振り向かないでください...",
  "闇が凝縮されています...",
  "誰かがあなたの画面を見ています..."
];

const LoadingScreen: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-red-800 transition-opacity duration-1000">
      <div className="animate-bounce mb-8">
        <Skull size={64} strokeWidth={1} className="animate-pulse text-red-700" />
      </div>
      <p className="text-xl md:text-2xl font-serif tracking-widest animate-flicker text-center px-4">
        {messages[messageIndex]}
      </p>
      <div className="mt-8 w-64 h-1 bg-gray-900 rounded overflow-hidden">
        <div className="h-full bg-red-900 animate-[width_3s_ease-in-out_infinite]" style={{ width: '50%' }}></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
