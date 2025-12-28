export type HorrorIntensity = 'mild' | 'standard' | 'extreme';
export type VisualTheme = 'default' | 'tombstone' | 'parchment' | 'asylum';
export type Language = 'ja' | 'en';
export type VoiceName = 'Fenrir' | 'Charon' | 'Kore' | 'Puck' | 'Zephyr' | 'Aoede' | string;

export interface UserProfile {
  username: string;
  language: Language;
  intensity: HorrorIntensity;
  theme: VisualTheme;
  brightness: number;
  jumpScaresEnabled: boolean;
  voice: VoiceName;
}

export interface StoryState {
  id?: string;
  createdAt?: number;
  title: string;
  content: string;
  mood: 'psychological' | 'slasher' | 'paranormal' | 'creepy';
  imagePrompt: string; // Prompt for the image generator
  imageUrl?: string;   // Base64 image data
  jumpScareTiming?: number; // 0.0 to 1.0 (float) representing the point of highest tension
  language?: Language;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}

export interface AudioState {
  isPlaying: boolean;
  audioBuffer: AudioBuffer | null;
}