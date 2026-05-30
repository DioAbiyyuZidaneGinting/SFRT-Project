class VoiceService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  public isEnabled: boolean = true; // For presentation mode
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;

  constructor() {
    this.synth = window.speechSynthesis;
    
    // Attempt to load a futuristic/robot voice if available
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      // Try to find a good english tech voice
      this.voice = voices.find(v => v.name.includes('Google US English') || v.lang === 'en-US' || v.lang === 'en-GB') || voices[0];
    };

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }

  public toggle(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public speak(text: string) {
    if (!this.isEnabled) return;
    
    // Debounce to prevent spam: don't speak the exact same phrase within 5 seconds,
    // or ANY phrase within 1 second of another.
    const now = Date.now();
    if (this.lastSpokenText === text && now - this.lastSpokenTime < 5000) return;
    if (now - this.lastSpokenTime < 1000) return;

    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    if (this.synth.speaking) {
      this.synth.cancel(); // Interrupt current speech if new one takes priority
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = 1.05; // Slightly faster for tech feel
    utterance.pitch = 0.9; // Slightly deeper

    this.synth.speak(utterance);
  }
}

export const voiceService = new VoiceService();
