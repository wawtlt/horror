import React, { useEffect, useRef } from 'react';
import { Ear, EarOff } from 'lucide-react';

interface AmbientSoundProps {
  isPlaying: boolean;
  toggle: () => void;
}

const AmbientSound: React.FC<AmbientSoundProps> = ({ isPlaying, toggle }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const eventTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      startSound();
    } else {
      stopSound();
    }
    
    return () => {
      stopSound();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Helper: Generate Pink Noise Buffer (Smoother than white noise)
  const createPinkNoise = (ctx: AudioContext) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; 
      b6 = white * 0.115926;
    }
    return buffer;
  };

  // 1. Unsettling Wind (Filtered Pink Noise with LFO)
  const playWind = (ctx: AudioContext, destination: AudioNode) => {
    const buffer = createPinkNoise(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;

    // LFO to modulate wind frequency (simulating gusts)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.07; // Slow sweep

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300; // Sweep range

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.value = 0.5; // Wind volume

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start();
    lfo.start();
  };

  // 2. Dark Drone (Low Oscillators)
  const playDrone = (ctx: AudioContext, destination: AudioNode) => {
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.value = 45; // Sub-bass

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 48; // Slight detune for beating effect

      const gain = ctx.createGain();
      gain.gain.value = 0.15;

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(destination);

      osc1.start();
      osc2.start();
  };

  // 3. Random SFX: Creaking Wood / Metallic Scrape
  const triggerCreak = (ctx: AudioContext, destination: AudioNode) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      
      const now = ctx.currentTime;
      // Start high, drop low rapidly
      osc.frequency.setValueAtTime(Math.random() * 100 + 100, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      // Noise texture FM
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 40;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 200;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 200;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start();
      lfo.start();
      osc.stop(now + 0.7);
      lfo.stop(now + 0.7);
  };

  // 4. Random SFX: Ghostly Whispers (Filtered Noise Bursts)
  const triggerWhisper = (ctx: AudioContext, destination: AudioNode) => {
      const buffer = createPinkNoise(ctx);
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const now = ctx.currentTime;
      const duration = 2.0 + Math.random();

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 500, now);
      filter.frequency.linearRampToValueAtTime(1500 + Math.random() * 500, now + duration);
      filter.Q.value = 5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + duration * 0.2);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      noise.start();
      noise.stop(now + duration + 0.1);
  };

  // Scheduler logic
  const scheduleNextEvent = (ctx: AudioContext, destination: AudioNode) => {
      const delay = Math.random() * 8000 + 4000; // 4-12 seconds interval
      
      eventTimeoutRef.current = setTimeout(() => {
          if (!ctx || ctx.state === 'closed') return;
          
          const rand = Math.random();
          if (rand > 0.6) {
             triggerCreak(ctx, destination);
          } else {
             triggerWhisper(ctx, destination);
          }
          
          scheduleNextEvent(ctx, destination);
      }, delay);
  };

  const startSound = () => {
    if (audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.5; // Master volume
      masterGain.connect(ctx.destination);

      playDrone(ctx, masterGain);
      playWind(ctx, masterGain);
      scheduleNextEvent(ctx, masterGain);

    } catch (e) {
      console.error("Ambient sound failed:", e);
    }
  };

  const stopSound = () => {
    if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
        eventTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  return (
    <button
      onClick={toggle}
      className={`fixed bottom-6 right-6 z-40 p-3 rounded-full backdrop-blur-sm transition-all duration-300 border ${
        isPlaying 
          ? 'bg-red-900/20 text-red-500 border-red-900/50 animate-pulse' 
          : 'bg-black/40 text-gray-500 border-gray-800 hover:text-gray-300'
      }`}
      aria-label={isPlaying ? "環境音を停止" : "環境音を再生"}
    >
      {isPlaying ? <Ear size={24} /> : <EarOff size={24} />}
    </button>
  );
};

export default AmbientSound;