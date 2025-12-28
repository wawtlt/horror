import React, { useState, useEffect } from 'react';
import { X, Twitter, Share2, Copy, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultText: string;
  url: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, defaultText, url }) => {
  const [text, setText] = useState(defaultText);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setText(defaultText);
        setIsCopied(false);
    }
  }, [isOpen, defaultText]);

  if (!isOpen) return null;

  const handleTweet = () => {
    const tweetText = `${text}`; // User edited text
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kaidan (怪談)',
          text: text,
          url: url,
        });
      } catch (err) {
        console.log('Share canceled:', err);
      }
    } else {
        // Fallback
        handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-gray-950 border border-gray-800 p-6 shadow-2xl rounded-sm animate-in fade-in zoom-in duration-300">
         <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
         >
            <X size={24} />
         </button>

         <h3 className="text-xl font-serif font-bold text-gray-200 mb-6 tracking-widest flex items-center gap-2 border-b border-gray-800 pb-4">
            <Share2 className="text-red-900" size={24} />
            <span>SHARE THE HORROR</span>
         </h3>
         
         <div className="mb-4">
             <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Message Preview</label>
             <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-32 bg-gray-900/50 border border-gray-700 p-3 text-gray-300 focus:border-red-900 focus:outline-none rounded-sm resize-none font-sans text-sm leading-relaxed"
             />
         </div>

         <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
           <button 
             onClick={handleTweet} 
             className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2]/10 text-[#1DA1F2] border border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/20 rounded-sm transition-all"
           >
             <Twitter size={18} />
             <span>Post</span>
           </button>
           
           <button 
             onClick={handleWebShare} 
             className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 rounded-sm transition-all"
           >
             <Share2 size={18} />
             <span>Share</span>
           </button>
           
           <button 
             onClick={handleCopy} 
             className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 rounded-sm transition-all"
           >
             {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
             <span>{isCopied ? "Copied" : "Copy"}</span>
           </button>
         </div>
      </div>
    </div>
  );
};

export default ShareModal;