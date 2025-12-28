import React from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '', intensity = 'medium' }) => {
  return (
    <div className={`relative inline-block group ${className}`}>
      <span className="relative z-10">{text}</span>
      <span 
        className={`absolute top-0 left-0 -z-10 w-full h-full text-red-600 opacity-0 group-hover:opacity-70 animate-pulse translate-x-[2px]`}
        aria-hidden="true"
      >
        {text}
      </span>
      <span 
        className={`absolute top-0 left-0 -z-10 w-full h-full text-blue-900 opacity-0 group-hover:opacity-70 animate-pulse -translate-x-[2px]`}
        aria-hidden="true"
      >
        {text}
      </span>
    </div>
  );
};

export default GlitchText;
