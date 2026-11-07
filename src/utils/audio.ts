// Web Audio API Vinyl Needle & Crackle Sound Generator
class VinylAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  private init() {
    if (this.ctx) return;
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtxClass();
  }

  public play() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (this.isPlaying) return;

      // 10-second buffer with periodic dust pops and subtle surface hiss
      const bufferSize = this.ctx.sampleRate * 4;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        // Pink noise filter base
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        let sample = (b0 + b1 + b2) * 0.04;

        // Random micro clicks / dust ticks
        if (Math.random() < 0.0007) {
          sample += (Math.random() * 2 - 1) * 0.6;
        }

        output[i] = sample;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Bandpass filter to match realistic vinyl surface rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 850;
      filter.Q.value = 1.2;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 1.2);

      whiteNoise.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      whiteNoise.start(0);
      this.noiseNode = whiteNoise;
      this.isPlaying = true;
    } catch {
      // Audio autoplay policy catch
    }
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.gainNode) return;
    try {
      this.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      setTimeout(() => {
        if (this.noiseNode) {
          (this.noiseNode as AudioBufferSourceNode).stop();
          this.noiseNode.disconnect();
          this.noiseNode = null;
        }
        this.isPlaying = false;
      }, 500);
    } catch {
      this.isPlaying = false;
    }
  }
}

export const vinylAudio = new VinylAudioEngine();
