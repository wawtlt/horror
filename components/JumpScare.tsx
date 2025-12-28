import React, { useEffect, useState } from 'react';
import { HorrorIntensity } from '../types';

interface JumpScareProps {
  onComplete: () => void;
  intensity: HorrorIntensity;
}

const JumpScare: React.FC<JumpScareProps> = ({ onComplete, intensity }) => {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // 1. Audio Synthesis for the Scare
    const triggerSound = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        
        const now = ctx.currentTime;
        // Adjust duration based on intensity
        const duration = intensity === 'mild' ? 0.3 : intensity === 'extreme' ? 0.8 : 0.5;
        
        // Adjust Volume Base
        const volumeBase = intensity === 'mild' ? 0.2 : intensity === 'extreme' ? 1.0 : 0.6;

        // Create a chaotic cluster of oscillators
        const freqs = intensity === 'mild' 
          ? [100, 200] // Simple low thud for mild
          : [100, 200, 450, 800, 5000]; // Complex scream for others

        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
          osc.frequency.setValueAtTime(f, now);
          
          if (intensity !== 'mild') {
             osc.frequency.exponentialRampToValueAtTime(f * (Math.random() + 0.5), now + duration);
          }
          
          gain.gain.setValueAtTime(volumeBase, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + duration);
        });

        // Add White Noise burst (Static)
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(volumeBase * 1.2, now); // Noise is slightly louder
        noiseGain.gain.linearRampToValueAtTime(0, now + duration);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);

      } catch (e) {
        console.error("Jump scare audio failed", e);
      }
    };

    triggerSound();

    // 2. Timeout to clean up
    const visualDuration = intensity === 'mild' ? 400 : intensity === 'extreme' ? 1000 : 600;
    const timer = setTimeout(() => {
      setIsActive(false);
      onComplete();
    }, visualDuration);

    return () => clearTimeout(timer);
  }, [onComplete, intensity]);

  if (!isActive) return null;

  // Visual Intensity Configurations
  const bgColor = intensity === 'mild' ? 'bg-black/80' : 'bg-red-600';
  const overlayAnim = intensity === 'extreme' ? 'animate-[pulse_0.05s_ease-in-out_infinite]' : 'animate-[pulse_0.1s_ease-in-out_infinite]';
  const showFace = intensity !== 'mild';
  const showText = intensity !== 'mild';

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex items-center justify-center">
      {/* Flashing Background */}
      <div className={`absolute inset-0 ${bgColor} ${overlayAnim} mix-blend-exclusion`}></div>
      
      {/* Glitch Overlay */}
      {intensity !== 'mild' && (
        <div className="absolute inset-0 bg-black opacity-50 mix-blend-hard-light animate-[ping_0.2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
      )}

      {/* Visual Artifact (Scary Face Abstraction) */}
      {showFace && (
        <div className="relative z-10 w-full h-full opacity-80 mix-blend-difference transform scale-150 animate-[spin_0.1s_linear_infinite]">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-black">
                <path d="M0,0 L100,0 L100,100 L0,100 Z M20,20 L40,30 L20,40 Z M60,20 L80,30 L60,40 Z M30,60 Q50,90 70,60 Z" />
            </svg>
        </div>
      )}

      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-9xl font-bold text-white mix-blend-difference animate-bounce">
                !?
            </div>
        </div>
      )}
      
      {/* Mild visual just gets a quick blackout/glitch feel without the face */}
      {intensity === 'mild' && (
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl text-white font-serif tracking-widest opacity-80 animate-pulse">
               ...
            </div>
         </div>
      )}
    </div>
  );
};

export default JumpScare;
