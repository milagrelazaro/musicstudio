// Audio Export Service for Professional DAW

class AudioExporter {
  constructor() {
    this.audioContext = null;
  }

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  async exportToWAV(audioBuffer, options = {}) {
    const {
      bitDepth = 24,
      sampleRate = 48000
    } = options;

    await this.initialize();

    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * (bitDepth / 8);
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true);
    view.setUint16(32, numberOfChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Write audio data
    const offset = 44;
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    let index = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        
        if (bitDepth === 16) {
          const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          view.setInt16(offset + index, int16, true);
          index += 2;
        } else if (bitDepth === 24) {
          const int24 = sample < 0 ? sample * 0x800000 : sample * 0x7FFFFF;
          view.setInt32(offset + index, int24, true);
          index += 4; // 24-bit aligned to 32-bit
        } else if (bitDepth === 32) {
          const int32 = sample < 0 ? sample * 0x80000000 : sample * 0x7FFFFFFF;
          view.setInt32(offset + index, int32, true);
          index += 4;
        }
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  async exportToMP3(audioBuffer, options = {}) {
    const {
      bitrate = 320,
      sampleRate = 48000
    } = options;

    // Use lamejs for MP3 conversion
    const lamejs = await import('lamejs');
    
    await this.initialize();

    const numberOfChannels = audioBuffer.numberOfChannels;
    const mp3encoder = new lamejs.Mp3Encoder(numberOfChannels, sampleRate, bitrate);
    
    const mp3Data = [];
    const blockSize = 1152;
    
    const left = audioBuffer.getChannelData(0);
    const right = numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
    
    for (let i = 0; i < left.length; i += blockSize) {
      const leftChunk = left.subarray(i, i + blockSize);
      const rightChunk = right.subarray(i, i + blockSize);
      
      const leftInt16 = new Int16Array(leftChunk.length);
      const rightInt16 = new Int16Array(rightChunk.length);
      
      for (let j = 0; j < leftChunk.length; j++) {
        leftInt16[j] = leftChunk[j] * 32767.5;
        rightInt16[j] = rightChunk[j] * 32767.5;
      }
      
      const mp3buf = mp3encoder.encodeBuffer(leftInt16, rightInt16);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
    
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
    
    return new Blob(mp3Data, { type: 'audio/mp3' });
  }

  async exportToFLAC(audioBuffer, options = {}) {
    // FLAC export would require a library like flac.js
    // For now, we'll export as WAV as fallback
    console.warn('FLAC export not yet implemented, falling back to WAV');
    return await this.exportToWAV(audioBuffer, options);
  }

  async exportStems(tracks, options = {}) {
    const {
      format = 'wav',
      sampleRate = 48000,
      bitDepth = 24
    } = options;

    const stems = [];

    for (const track of tracks) {
      if (track.clips && track.clips.length > 0) {
        // Combine all clips from this track
        const combinedBuffer = await this.combineClips(track.clips, sampleRate);
        
        let blob;
        if (format === 'wav') {
          blob = await this.exportToWAV(combinedBuffer, { bitDepth, sampleRate });
        } else if (format === 'mp3') {
          blob = await this.exportToMP3(combinedBuffer, { sampleRate });
        } else if (format === 'flac') {
          blob = await this.exportToFLAC(combinedBuffer, { sampleRate, bitDepth });
        }

        stems.push({
          trackName: track.name,
          blob,
          format
        });
      }
    }

    return stems;
  }

  async combineClips(clips, sampleRate) {
    await this.initialize();

    // Calculate total duration
    const totalDuration = clips.reduce((max, clip) => {
      return Math.max(max, clip.startTime + clip.duration);
    }, 0);

    const totalSamples = Math.ceil(totalDuration * sampleRate);
    const combinedBuffer = this.audioContext.createBuffer(
      2, // stereo
      totalSamples,
      sampleRate
    );

    // Mix all clips
    for (const clip of clips) {
      if (clip.audioBuffer) {
        const startSample = Math.floor(clip.startTime * sampleRate);
        const clipSamples = clip.audioBuffer.length;

        for (let channel = 0; channel < Math.min(2, clip.audioBuffer.numberOfChannels); channel++) {
          const sourceData = clip.audioBuffer.getChannelData(channel);
          const destData = combinedBuffer.getChannelData(channel);

          for (let i = 0; i < Math.min(clipSamples, totalSamples - startSample); i++) {
            destData[startSample + i] += sourceData[i];
          }
        }
      }
    }

    return combinedBuffer;
  }

  async exportProject(project, options = {}) {
    const {
      format = 'wav',
      sampleRate = 48000,
      bitDepth = 24,
      includeMasterEffects = true
    } = options;

    // Combine all tracks into master mix
    const masterBuffer = await this.createMasterMix(project, sampleRate, includeMasterEffects);

    let blob;
    if (format === 'wav') {
      blob = await this.exportToWAV(masterBuffer, { bitDepth, sampleRate });
    } else if (format === 'mp3') {
      blob = await this.exportToMP3(masterBuffer, { sampleRate });
    } else if (format === 'flac') {
      blob = await this.exportToFLAC(masterBuffer, { sampleRate, bitDepth });
    }

    return blob;
  }

  async createMasterMix(project, sampleRate, includeEffects) {
    await this.initialize();

    // Calculate total duration
    const totalDuration = project.totalDuration || 300; // default 5 minutes
    const totalSamples = Math.ceil(totalDuration * sampleRate);
    const masterBuffer = this.audioContext.createBuffer(2, totalSamples, sampleRate);

    // Mix all tracks
    for (const track of project.tracks) {
      if (track.clips && track.clips.length > 0) {
        const trackBuffer = await this.combineClips(track.clips, sampleRate);
        
        // Apply track volume and pan
        const volume = track.volume || 0.8;
        const pan = track.pan || 0;

        for (let channel = 0; channel < 2; channel++) {
          const sourceData = trackBuffer.getChannelData(channel);
          const destData = masterBuffer.getChannelData(channel);

          const channelGain = channel === 0 ? (1 - pan) / 2 : (1 + pan) / 2;
          const gain = volume * channelGain;

          for (let i = 0; i < Math.min(sourceData.length, totalSamples); i++) {
            destData[i] += sourceData[i] * gain;
          }
        }
      }
    }

    // Apply master volume
    const masterVolume = project.master?.volume || 1.0;
    for (let channel = 0; channel < 2; channel++) {
      const data = masterBuffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        data[i] *= masterVolume;
      }
    }

    return masterBuffer;
  }

  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export default new AudioExporter();
