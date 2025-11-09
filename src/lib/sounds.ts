import wrongAnswerSound from '@/assets/sounds/wrong-answer.mp3';
import correctSound from '@/assets/sounds/correct.mp3';
import clickSound from '@/assets/sounds/click.mp3';
import backgroundMusic from '@/assets/sounds/background-music.mp3';

// Sound effect manager using HTML5 Audio
class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private backgroundAudio: HTMLAudioElement | null = null;
  private isMusicMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  // Initialize sounds
  init() {
    // Pass sound (wrong answer)
    this.sounds.set('pass', new Audio(wrongAnswerSound));
    
    // Like sound (correct)
    this.sounds.set('like', new Audio(correctSound));
    
    // Button click
    this.sounds.set('click', new Audio(clickSound));
    
    // Purchase success (use correct sound)
    this.sounds.set('purchase', new Audio(correctSound));
    
    // Achievement unlock (use correct sound)
    this.sounds.set('achievement', new Audio(correctSound));
    
    // Background music
    this.backgroundAudio = new Audio(backgroundMusic);
    this.backgroundAudio.loop = true;
    this.backgroundAudio.volume = 0.3;
    
    // Load music mute state from localStorage
    const savedMuteState = localStorage.getItem('musicMuted');
    this.isMusicMuted = savedMuteState === 'true';
  }

  play(soundName: string, volume: number = 0.5) {
    const sound = this.sounds.get(soundName);
    if (!sound) return;

    // Clone the audio to allow overlapping sounds
    const audioClone = sound.cloneNode() as HTMLAudioElement;
    audioClone.volume = volume;
    audioClone.play().catch(err => console.log('Audio play failed:', err));
  }

  // Start background music
  startBackgroundMusic() {
    if (this.backgroundAudio && !this.isMusicMuted) {
      this.backgroundAudio.play().catch(err => console.log('Background music play failed:', err));
    }
  }

  // Stop background music
  stopBackgroundMusic() {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
    }
  }

  // Toggle music mute
  toggleMusicMute() {
    this.isMusicMuted = !this.isMusicMuted;
    localStorage.setItem('musicMuted', String(this.isMusicMuted));
    
    if (this.isMusicMuted) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
    
    return this.isMusicMuted;
  }

  // Get current mute state
  isMusicMutedState() {
    return this.isMusicMuted;
  }

  // Play achievement with special effect
  playAchievement() {
    this.play('achievement', 0.6);
  }
}

export const soundManager = new SoundManager();
