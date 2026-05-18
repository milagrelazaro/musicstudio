// Audio Effects Service using Tone.js
import * as Tone from 'tone';

class AudioEffectsService {
  constructor() {
    this.context = null;
    this.tracks = new Map(); // Map of trackId to effects chain
    this.masterChain = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Initialize Tone.js context
    await Tone.start();
    this.context = Tone.context;

    // Create master chain
    this.masterChain = this.createMasterChain();

    this.initialized = true;
  }

  createMasterChain() {
    const chain = new Tone.Chain();

    // EQ
    const eq = new Tone.EQ3(0, 0, 0);
    
    // Compressor
    const compressor = new Tone.Compressor({
      threshold: -18,
      ratio: 2,
      attack: 0.01,
      release: 0.5
    });

    // Limiter
    const limiter = new Tone.Limiter(-0.1);

    // Connect chain
    chain.connect(eq);
    eq.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(Tone.Destination);

    return {
      chain,
      eq,
      compressor,
      limiter
    };
  }

  createTrackEffects(trackId) {
    const effects = {};

    // EQ
    effects.eq = new Tone.EQ3(0, 0, 0);

    // Compressor
    effects.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.005,
      release: 0.25
    });

    // Reverb (send effect)
    effects.reverb = new Tone.Reverb({
      decay: 2,
      preDelay: 0.01
    });
    effects.reverb.wet.value = 0;

    // Delay (send effect)
    effects.delay = new Tone.FeedbackDelay({
      delayTime: 0.3,
      feedback: 0.3,
      wet: 0
    });

    // Volume
    effects.volume = new Tone.Volume(0);

    // Panner
    effects.panner = new Tone.Panner(0);

    // Connect chain
    effects.chain = new Tone.Chain();
    effects.chain.connect(effects.eq);
    effects.eq.connect(effects.compressor);
    effects.compressor.connect(effects.panner);
    effects.panner.connect(effects.volume);
    effects.volume.connect(this.masterChain.chain);

    // Connect send effects in parallel
    effects.compressor.connect(effects.reverb);
    effects.compressor.connect(effects.delay);
    effects.reverb.connect(effects.volume);
    effects.delay.connect(effects.volume);

    this.tracks.set(trackId, effects);
    return effects;
  }

  getTrackEffects(trackId) {
    return this.tracks.get(trackId);
  }

  updateTrackEQ(trackId, settings) {
    const effects = this.tracks.get(trackId);
    if (!effects || !effects.eq) return;

    effects.eq.low.value = settings.low;
    effects.eq.mid.value = settings.mid;
    effects.eq.high.value = settings.high;
  }

  updateTrackCompressor(trackId, settings) {
    const effects = this.tracks.get(trackId);
    if (!effects || !effects.compressor) return;

    effects.compressor.threshold.value = settings.threshold;
    effects.compressor.ratio.value = settings.ratio;
    effects.compressor.attack.value = settings.attack;
    effects.compressor.release.value = settings.release;
  }

  updateTrackReverb(trackId, settings) {
    const effects = this.tracks.get(trackId);
    if (!effects || !effects.reverb) return;

    effects.reverb.decay = settings.decay;
    effects.reverb.preDelay = settings.preDelay;
    effects.reverb.wet.value = settings.wet;
  }

  updateTrackDelay(trackId, settings) {
    const effects = this.tracks.get(trackId);
    if (!effects || !effects.delay) return;

    effects.delay.delayTime.value = settings.time;
    effects.delay.feedback.value = settings.feedback;
    effects.delay.wet.value = settings.wet;
  }

  updateTrackVolume(trackId, volume) {
    const effects = this.tracks.get(trackId);
    if (!effects || !effects.volume) return;

    effects.volume.volume.value = Tone.gainToDb(volume);
  }

  updateTrackPan(trackId, pan) {
    const effects = this.tracks.get(trackId);
    if (!effects || !effects.panner) return;

    effects.panner.pan.value = pan;
  }

  setTrackMute(trackId, muted) {
    const effects = this.tracks.get(trackId);
    if (!effects || !effects.volume) return;

    if (muted) {
      effects.volume.mute = true;
    } else {
      effects.volume.mute = false;
    }
  }

  setTrackSolo(trackId, solo) {
    // Implement solo logic - mute all other tracks
    this.tracks.forEach((effects, id) => {
      if (solo && id !== trackId) {
        effects.volume.mute = true;
      } else if (!solo) {
        effects.volume.mute = false;
      }
    });
  }

  updateMasterEQ(settings) {
    if (!this.masterChain || !this.masterChain.eq) return;

    this.masterChain.eq.low.value = settings.low;
    this.masterChain.eq.mid.value = settings.mid;
    this.masterChain.eq.high.value = settings.high;
  }

  updateMasterCompressor(settings) {
    if (!this.masterChain || !this.masterChain.compressor) return;

    this.masterChain.compressor.threshold.value = settings.threshold;
    this.masterChain.compressor.ratio.value = settings.ratio;
    this.masterChain.compressor.attack.value = settings.attack;
    this.masterChain.compressor.release.value = settings.release;
  }

  updateMasterLimiter(threshold) {
    if (!this.masterChain || !this.masterChain.limiter) return;

    this.masterChain.limiter.threshold.value = threshold;
  }

  updateMasterVolume(volume) {
    if (!this.masterChain || !this.masterChain.chain) return;

    Tone.Destination.volume.value = Tone.gainToDb(volume);
  }

  updateMasterPan(pan) {
    // Master pan would require a panner node before destination
    // For now, we'll implement it as part of the chain
  }

  removeTrack(trackId) {
    const effects = this.tracks.get(trackId);
    if (effects) {
      effects.chain.disconnect();
      effects.eq.dispose();
      effects.compressor.dispose();
      effects.reverb.dispose();
      effects.delay.dispose();
      effects.volume.dispose();
      effects.panner.dispose();
      this.tracks.delete(trackId);
    }
  }

  cleanup() {
    // Dispose all track effects
    this.tracks.forEach((effects) => {
      effects.chain.disconnect();
      effects.eq.dispose();
      effects.compressor.dispose();
      effects.reverb.dispose();
      effects.delay.dispose();
      effects.volume.dispose();
      effects.panner.dispose();
    });
    this.tracks.clear();

    // Dispose master chain
    if (this.masterChain) {
      this.masterChain.chain.disconnect();
      this.masterChain.eq.dispose();
      this.masterChain.compressor.dispose();
      this.masterChain.limiter.dispose();
    }

    this.initialized = false;
  }
}

export default new AudioEffectsService();
