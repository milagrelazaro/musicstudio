// Waveform Renderer Service

class WaveformRenderer {
  constructor() {
    this.audioContext = null;
  }

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  async renderWaveform(audioBlob, options = {}) {
    const {
      width = 1000,
      height = 100,
      color = '#3B82F6',
      backgroundColor = 'transparent',
      samplesPerPixel = 10,
      normalize = true
    } = options;

    await this.initialize();

    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Get channel data
      const channelData = audioBuffer.getChannelData(0);
      
      // Calculate waveform data
      const waveform = this.calculateWaveform(channelData, width, samplesPerPixel, normalize);
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Draw background
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }
      
      // Draw waveform
      this.drawWaveform(ctx, waveform, width, height, color);
      
      return canvas.toDataURL();
    } catch (error) {
      console.error('Error rendering waveform:', error);
      throw error;
    }
  }

  calculateWaveform(channelData, width, samplesPerPixel, normalize) {
    const waveform = [];
    const totalSamples = channelData.length;
    const samplesPerBar = Math.max(1, Math.floor(totalSamples / width));
    
    for (let i = 0; i < width; i++) {
      const startSample = i * samplesPerBar;
      const endSample = Math.min(startSample + samplesPerBar, totalSamples);
      
      let min = 0;
      let max = 0;
      let sum = 0;
      let count = 0;
      
      for (let j = startSample; j < endSample; j++) {
        const sample = channelData[j];
        min = Math.min(min, sample);
        max = Math.max(max, sample);
        sum += Math.abs(sample);
        count++;
      }
      
      const average = count > 0 ? sum / count : 0;
      
      waveform.push({
        min,
        max,
        average
      });
    }
    
    // Normalize if requested
    if (normalize) {
      const maxAmplitude = Math.max(...waveform.map(w => Math.max(Math.abs(w.min), Math.abs(w.max))));
      if (maxAmplitude > 0) {
        waveform.forEach(w => {
          w.min /= maxAmplitude;
          w.max /= maxAmplitude;
          w.average /= maxAmplitude;
        });
      }
    }
    
    return waveform;
  }

  drawWaveform(ctx, waveform, width, height, color) {
    const centerY = height / 2;
    const barWidth = width / waveform.length;
    
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    // Draw as bars (like most DAWs)
    waveform.forEach((w, i) => {
      const x = i * barWidth;
      const barHeight = w.average * height * 0.8; // Use 80% of height
      const y = centerY - barHeight / 2;
      
      // Draw bar
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
    
    // Alternative: Draw as line (more traditional waveform)
    // ctx.beginPath();
    // waveform.forEach((w, i) => {
    //   const x = i * barWidth;
    //   const y1 = centerY - (w.max * height / 2);
    //   const y2 = centerY - (w.min * height / 2);
    //   
    //   if (i === 0) {
    //     ctx.moveTo(x, y1);
    //   } else {
    //     ctx.lineTo(x, y1);
    //   }
    // });
    // waveform.reverse().forEach((w, i) => {
    //   const x = width - ((i + 1) * barWidth);
    //   const y2 = centerY - (w.min * height / 2);
    //   ctx.lineTo(x, y2);
    // });
    // ctx.closePath();
    // ctx.stroke();
  }

  async renderWaveformForClip(clip, options = {}) {
    if (!clip.audioBuffer && !clip.audioBlob) {
      return null;
    }

    const {
      width = clip.duration * 50, // Default: 50 pixels per second
      height = 80,
      color = clip.color || '#3B82F6'
    } = options;

    let audioBlob;
    if (clip.audioBlob) {
      audioBlob = clip.audioBlob;
    } else if (clip.audioBuffer) {
      // Convert AudioBuffer to WAV blob
      audioBlob = await this.audioBufferToBlob(clip.audioBuffer);
    }

    if (!audioBlob) {
      return null;
    }

    return await this.renderWaveform(audioBlob, {
      width,
      height,
      color,
      ...options
    });
  }

  async audioBufferToBlob(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2;
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
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
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
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset + index, int16, true);
        index += 2;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export default new WaveformRenderer();
