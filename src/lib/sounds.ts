// Sound effect manager using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Generate a simple beep/click sound
  private createSound(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
    if (!this.audioContext) return null as any;
    
    const sampleRate = this.audioContext.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 5); // Fade out
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    return buffer;
  }

  // Initialize sounds
  init() {
    if (!this.audioContext) return;

    // Camera shutter sound (quick high-low pitch)
    this.sounds.set('shutter', this.createSound(800, 0.1, 'square'));
    
    // Like sound (pleasant chime)
    this.sounds.set('like', this.createSound(880, 0.15, 'sine'));
    
    // Purchase success (ascending notes)
    this.sounds.set('purchase', this.createSound(660, 0.2, 'sine'));
    
    // Swipe sound (soft whoosh)
    this.sounds.set('swipe', this.createSound(200, 0.1, 'sine'));
    
    // Achievement unlock (triumphant)
    this.sounds.set('achievement', this.createSound(1047, 0.3, 'sine'));
    
    // Button click (subtle)
    this.sounds.set('click', this.createSound(400, 0.05, 'square'));
  }

  play(soundName: string, volume: number = 0.3) {
    if (!this.audioContext || !this.sounds.has(soundName)) {
      this.init(); // Initialize if not done yet
      if (!this.sounds.has(soundName)) return;
    }

    const source = this.audioContext!.createBufferSource();
    const gainNode = this.audioContext!.createGain();
    
    source.buffer = this.sounds.get(soundName)!;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext!.destination);
    source.start();
  }

  // Play achievement with special effect
  playAchievement() {
    if (!this.audioContext) return;
    
    // Play three ascending notes
    const frequencies = [523, 659, 784]; // C, E, G
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const source = this.audioContext!.createBufferSource();
        const gainNode = this.audioContext!.createGain();
        
        const buffer = this.createSound(freq, 0.15, 'sine');
        source.buffer = buffer;
        gainNode.gain.value = 0.4;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);
        source.start();
      }, index * 100);
    });
  }
}

export const soundManager = new SoundManager();
