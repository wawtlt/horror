import React from 'react';
import { X, BookOpen, Trash2, Calendar, Clock } from 'lucide-react';
import { StoryState } from '../types';

interface StoryLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryState[];
  onSelect: (story: StoryState) => void;
  onDelete: (id: string) => void;
}

const StoryLibrary: React.FC<StoryLibraryProps> = ({ 
  isOpen, 
  onClose, 
  stories, 
  onSelect,
  onDelete 
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-gray-950 border border-gray-800 p-6 shadow-2xl animate-in fade-in zoom-in duration-300 rounded-sm flex flex-col max-h-[85vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2"
          aria-label="Close library"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-serif font-bold text-gray-100 mb-6 tracking-widest flex items-center gap-2 border-b border-gray-800 pb-4">
          <BookOpen className="text-red-900" />
          <span>怪談書庫 (Archives)</span>
        </h2>

        {stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-gray-600">
            <BookOpen size={48} className="mb-4 opacity-20" />
            <p className="tracking-widest font-serif">まだ記録はありません...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {stories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map((story) => (
              <div 
                key={story.id} 
                className="group relative bg-gray-900/40 border border-gray-800 hover:border-red-900/50 p-4 transition-all duration-300 flex flex-col md:flex-row gap-4"
              >
                {/* Thumbnail */}
                <div 
                  className="w-full md:w-32 h-24 bg-black flex-shrink-0 overflow-hidden cursor-pointer relative"
                  onClick={() => onSelect(story)}
                >
                  {story.imageUrl ? (
                    <img 
                      src={`data:image/jpeg;base64,${story.imageUrl}`} 
                      alt={story.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 filter grayscale group-hover:grayscale-0"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-800">
                      <BookOpen size={20} />
                    </div>
                  )}
                  {/* Glitch effect on hover */}
                  <div className="absolute inset-0 bg-red-900/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="cursor-pointer" onClick={() => onSelect(story)}>
                    <h3 className="text-lg font-serif font-bold text-gray-200 group-hover:text-red-500 transition-colors mb-1 line-clamp-1">
                      {story.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-serif line-clamp-2 leading-relaxed mb-2">
                      {story.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(story.createdAt)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full bg-black/50 border border-gray-800 ${
                        story.mood === 'psychological' ? 'text-purple-400 border-purple-900/30' :
                        story.mood === 'slasher' ? 'text-red-400 border-red-900/30' :
                        story.mood === 'paranormal' ? 'text-blue-400 border-blue-900/30' :
                        'text-gray-400'
                      }`}>
                        {story.mood}
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (story.id) onDelete(story.id);
                      }}
                      className="text-gray-600 hover:text-red-500 transition-colors p-2 -mr-2"
                      title="削除 / Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-800 text-center text-xs text-gray-500 font-serif">
          {stories.length} stories archived
        </div>
      </div>
    </div>
  );
};

export default StoryLibrary;