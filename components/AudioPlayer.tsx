import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Pause } from 'lucide-react';
import { decode, decodeAudioData } from '../services/audioUtils';

interface AudioPlayerProps {
  base64Audio: string | null;
  autoPlay?: boolean;
  jumpScareTiming?: number; // 0.0 to 1.0
  onJumpScareTrigger?: () => void;
  onAnticipation?: (isActive: boolean) => void;
  jumpScaresEnabled?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  base64Audio, 
  autoPlay = false,
  jumpScareTiming,
  onJumpScareTrigger,
  onAnticipation,
  jumpScaresEnabled = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Timing tracking
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);
  const isAnticipatingRef = useRef<boolean>(false);
  const preciseJumpTimeRef = useRef<number | null>(null);

  // Initialize Audio Context and Decode Audio
  useEffect(() => {
    if (!base64Audio) return;

    const initAudio = async () => {
      try {
        // Close existing context if any to prevent leaks
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(ctx);

        const bytes = decode(base64Audio);
        const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
        setAudioBuffer(buffer);

        // Analyze audio to find optimal jump scare time
        if (jumpScareTiming) {
            calculateOptimalJumpTime(buffer, jumpScareTiming);
        }

        // Reset state
        pausedAtRef.current = 0;
        hasTriggeredRef.current = false;
        isAnticipatingRef.current = false;

        if (autoPlay) {
          playAudio(ctx, buffer, 0);
        }
      } catch (err) {
        console.error("Audio initialization failed", err);
        setError("音声データの解析に失敗しました");
      }
    };

    initAudio();

    return () => {
      stopAudio();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base64Audio]); // Re-run if audio source changes

  // Update jump timing analysis if timing prop changes
  useEffect(() => {
      if (audioBuffer && jumpScareTiming) {
          calculateOptimalJumpTime(audioBuffer, jumpScareTiming);
      }
  }, [jumpScareTiming, audioBuffer]);

  // Analyze audio buffer to find a local peak loudness around the estimated timestamp
  // This ensures the jump scare hits on a "loud" moment (like a scream or emphasis) rather than silence
  const calculateOptimalJumpTime = (buffer: AudioBuffer, relativeTiming: number) => {
    const duration = buffer.duration;
    const estimatedTime = duration * relativeTiming;
    
    // Define a search window (+/- 1.5 seconds)
    const windowSize = 3.0; 
    const sampleRate = buffer.sampleRate;
    const channelData = buffer.getChannelData(0);
    
    const startSample = Math.max(0, Math.floor((estimatedTime - windowSize/2) * sampleRate));
    const endSample = Math.min(channelData.length, Math.floor((estimatedTime + windowSize/2) * sampleRate));
    
    let maxAmplitude = 0;
    let peakIndex = Math.floor(estimatedTime * sampleRate); // Default to estimated

    // Optimization: Step through samples to save CPU (check every 100th sample approx 4ms)
    const step = 100;
    for (let i = startSample; i < endSample; i += step) {
        const amplitude = Math.abs(channelData[i]);
        if (amplitude > maxAmplitude) {
            maxAmplitude = amplitude;
            peakIndex = i;
        }
    }

    // If the peak is significantly quiet (silence), stick to the original estimation
    // otherwise shift to the peak.
    const optimizedTime = (maxAmplitude > 0.05) ? (peakIndex / sampleRate) : estimatedTime;
    
    console.log(`Jump Scare Timing Optimized: ${estimatedTime.toFixed(2)}s -> ${optimizedTime.toFixed(2)}s (Amp: ${maxAmplitude.toFixed(2)})`);
    preciseJumpTimeRef.current = optimizedTime;
  };

  const monitorProgress = (ctx: AudioContext, duration: number) => {
    const check = () => {
      // If we stopped playing, stop monitoring
      if (!isPlaying && !sourceNodeRef.current) return;
      
      const currentTime = ctx.currentTime - startTimeRef.current;
      
      // Use the optimized time if available, otherwise fallback
      const targetTime = preciseJumpTimeRef.current !== null 
         ? preciseJumpTimeRef.current 
         : (jumpScareTiming ? duration * jumpScareTiming : -1);

      if (targetTime > 0 && jumpScaresEnabled) {
          const timeRemaining = targetTime - currentTime;

          // Anticipation Logic (trigger 4.5 seconds before scare for buildup)
          if (onAnticipation) {
            if (timeRemaining <= 4.5 && timeRemaining > 0 && !isAnticipatingRef.current) {
              isAnticipatingRef.current = true;
              onAnticipation(true);
            }
            else if ((timeRemaining <= 0 || !isPlaying) && isAnticipatingRef.current) {
              isAnticipatingRef.current = false;
              onAnticipation(false);
            }
          }

          // Jump Scare Trigger Logic
          if (onJumpScareTrigger && !hasTriggeredRef.current && currentTime >= targetTime) {
            hasTriggeredRef.current = true;
            if (onAnticipation && isAnticipatingRef.current) {
              isAnticipatingRef.current = false;
              onAnticipation(false);
            }
            onJumpScareTrigger();
          }
      }

      // Continue loop if still within duration
      if (currentTime < duration) {
        animationFrameRef.current = requestAnimationFrame(check);
      } else {
        // Audio finished
        setIsPlaying(false);
        pausedAtRef.current = 0;
        if (onAnticipation) onAnticipation(false);
        isAnticipatingRef.current = false;
      }
    };

    animationFrameRef.current = requestAnimationFrame(check);
  };

  const playAudio = (ctx: AudioContext, buffer: AudioBuffer, startOffset: number = 0) => {
    // Stop any existing source
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) { /* ignore */ }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.0; 
    
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.onended = () => {
       // We handle state cleanup in monitorProgress mostly, but this is a safety net
       // However, manually stopping triggers onended too, so we need careful state management
    };

    // Correctly set start time relative to context
    startTimeRef.current = ctx.currentTime - startOffset;
    
    source.start(0, startOffset);
    sourceNodeRef.current = source;
    setIsPlaying(true);

    monitorProgress(ctx, buffer.duration);
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current && audioContext) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) { /* ignore */ }
      
      // Calculate where we paused
      pausedAtRef.current = audioContext.currentTime - startTimeRef.current;
      sourceNodeRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsPlaying(false);
    
    // Stop anticipation effects if paused
    if (onAnticipation) onAnticipation(false);
    isAnticipatingRef.current = false;
  };

  const stopAudio = () => {
      pauseAudio();
      pausedAtRef.current = 0; // Reset progress
      hasTriggeredRef.current = false; // Reset trigger
  };

  const togglePlayback = () => {
    if (!audioContext || !audioBuffer) return;

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    if (isPlaying) {
      pauseAudio();
    } else {
      // Resume from pausedAt or start from 0
      playAudio(audioContext, audioBuffer, pausedAtRef.current);
    }
  };

  if (!base64Audio) return null;

  return (
    <div className="flex items-center gap-4 p-4 border border-red-900/30 bg-black/50 backdrop-blur-sm rounded-sm mt-6">
      <button
        onClick={togglePlayback}
        className="flex items-center justify-center w-12 h-12 rounded-full border border-red-800 text-red-600 hover:bg-red-900/20 hover:text-red-400 transition-all duration-300 focus:outline-none focus:border-red-500"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
      </button>
      
      <div className="flex-1">
        <p className="text-xs text-red-800 uppercase tracking-widest mb-1">Narration</p>
        <div className="h-1 bg-gray-900 w-full rounded overflow-hidden relative">
            {/* Playback Bar Animation */}
            {isPlaying && (
                 <div className="h-full bg-red-800 absolute top-0 left-0 animate-[pulse_2s_infinite]" 
                      style={{ 
                          width: '100%',
                          animationName: 'progress-indeterminate', // Fallback as we don't map precise width here for simplicity
                          transformOrigin: 'left'
                      }}>
                 </div>
            )}
            {!isPlaying && pausedAtRef.current > 0 && audioBuffer && (
                <div className="h-full bg-red-900/50 absolute top-0 left-0" 
                     style={{ width: `${(pausedAtRef.current / audioBuffer.duration) * 100}%` }}>
                </div>
            )}
        </div>
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default AudioPlayer;