import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react';

interface FeedbackProps {
  onSubmit: (rating: 'up' | 'down', text: string) => void;
}

const Feedback: React.FC<FeedbackProps> = ({ onSubmit }) => {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    onSubmit(rating, text);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mt-8 p-6 border border-gray-900 bg-black/40 text-center animate-in fade-in duration-500">
        <p className="text-red-700 font-serif tracking-widest text-sm">
          あなたの恐怖は記録されました...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12 p-6 border border-gray-900 bg-black/40 backdrop-blur-sm transition-all hover:border-red-900/30">
      <h3 className="text-gray-500 text-xs uppercase tracking-[0.2em] text-center mb-6">
        恐怖の評価 - FEEDBACK
      </h3>
      
      <div className="flex justify-center gap-12 mb-6">
        <button
          onClick={() => setRating('up')}
          className={`group flex flex-col items-center gap-3 transition-all duration-300 ${
            rating === 'up' ? 'text-red-600 scale-110' : 'text-gray-600 hover:text-red-800'
          }`}
          aria-label="Scary / Good"
        >
          <div className={`p-3 rounded-full border ${rating === 'up' ? 'border-red-600 bg-red-900/20' : 'border-gray-800 group-hover:border-red-900'}`}>
            <ThumbsUp size={24} strokeWidth={1.5} />
          </div>
          <span className="text-[10px] font-serif tracking-widest opacity-80">恐ろしい</span>
        </button>

        <button
          onClick={() => setRating('down')}
          className={`group flex flex-col items-center gap-3 transition-all duration-300 ${
            rating === 'down' ? 'text-blue-900 scale-110' : 'text-gray-600 hover:text-blue-900'
          }`}
          aria-label="Not Scary / Bad"
        >
          <div className={`p-3 rounded-full border ${rating === 'down' ? 'border-blue-900 bg-blue-900/20' : 'border-gray-800 group-hover:border-blue-900'}`}>
            <ThumbsDown size={24} strokeWidth={1.5} />
          </div>
          <span className="text-[10px] font-serif tracking-widest opacity-80">物足りない</span>
        </button>
      </div>

      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          rating ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="感想があれば教えてください..."
            className="flex-1 bg-gray-950 border border-gray-800 rounded-sm px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-900 transition-colors placeholder-gray-700 font-serif"
          />
          <button
            type="submit"
            className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 px-4 py-2 rounded-sm transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
