// Audio Converter Service using lamejs for MP3 conversion

import lamejs from 'lamejs';

class AudioConverterService {
  constructor() {
    this.sampleRate = 44100;
    this.bitRate = 128; // 128 kbps
  }

  async convertBlobToWav(audioBlob) {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: this.sampleRate
    });
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return this.audioBufferToWav(audioBuffer);
    } finally {
      await audioContext.close();
    }
  }

  audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = audioBuffer.length * blockAlign;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  async convertWavToMp3(wavBlob, onProgress) {
    const arrayBuffer = await wavBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: this.sampleRate
    });

    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return this.audioBufferToMp3(audioBuffer, onProgress);
    } finally {
      await audioContext.close();
    }
  }

  audioBufferToMp3(audioBuffer, onProgress) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const mp3Encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, this.bitRate);

    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    const sampleBlockSize = 1152;
    const mp3Data = [];
    let totalSamples = audioBuffer.length;

    for (let i = 0; i < totalSamples; i += sampleBlockSize) {
      const leftChunk = new Int16Array(sampleBlockSize);
      const rightChunk = numChannels > 1 ? new Int16Array(sampleBlockSize) : null;

      for (let j = 0; j < sampleBlockSize; j++) {
        const sampleIndex = i + j;
        if (sampleIndex < totalSamples) {
          // Convert float to 16-bit integer
          leftChunk[j] = this.floatTo16Bit(channels[0][sampleIndex]);
          if (numChannels > 1 && rightChunk) {
            rightChunk[j] = this.floatTo16Bit(channels[1][sampleIndex]);
          }
        } else {
          leftChunk[j] = 0;
          if (numChannels > 1 && rightChunk) {
            rightChunk[j] = 0;
          }
        }
      }

      let mp3buf;
      if (numChannels === 1) {
        mp3buf = mp3Encoder.encodeBuffer(leftChunk);
      } else {
        mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
      }

      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }

      // Report progress
      if (onProgress) {
        const progress = Math.min(100, ((i + sampleBlockSize) / totalSamples) * 100);
        onProgress(progress);
      }
    }

    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
  }

  floatTo16Bit(floatValue) {
    const s = Math.max(-1, Math.min(1, floatValue));
    return s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  async convertBlobToMp3(audioBlob, onProgress) {
    // First convert to WAV, then to MP3
    const wavBlob = await this.convertBlobToWav(audioBlob);
    return this.convertWavToMp3(wavBlob, onProgress);
  }

  setBitRate(bitRate) {
    this.bitRate = bitRate;
  }

  setSampleRate(sampleRate) {
    this.sampleRate = sampleRate;
  }
}

export default new AudioConverterService();
