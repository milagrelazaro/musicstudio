// Audio Capture Service using Web Audio API + MediaRecorder

class AudioCaptureService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.isRecording = false;
    this.startTime = null;
    this.duration = 0;
    this.onDataAvailable = null;
    this.onStop = null;
    this.onDurationUpdate = null;
    this.durationInterval = null;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await this.audioContext.resume();
      return true;
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      throw error;
    }
  }

  async startRecording(trackId = 'default') {
    try {
      if (!this.audioContext) {
        await this.initialize();
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      this.streams.set(trackId, stream);

      // Create analyser for this track
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      
      this.analysers.set(trackId, analyser);
      this.dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Create MediaRecorder for this track
      const mimeType = this.getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      this.recorders.set(trackId, mediaRecorder);
      this.trackChunks.set(trackId, []);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const chunks = this.trackChunks.get(trackId);
          chunks.push(event.data);
          this.trackChunks.set(trackId, chunks);
          
          if (this.onDataAvailable) {
            this.onDataAvailable(event.data, trackId);
          }
        }
      };

      mediaRecorder.onstop = () => {
        const chunks = this.trackChunks.get(trackId);
        const blob = new Blob(chunks, { type: mimeType });
        
        if (this.onStop) {
          this.onStop(blob, trackId);
        }

        // Cleanup
        this.trackChunks.set(trackId, []);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      this.recorders.set(trackId, mediaRecorder);

      // Start duration timer
      this.startTime = Date.now();
      this.timerInterval = setInterval(() => {
        this.duration = (Date.now() - this.startTime) / 1000;
        if (this.onDurationUpdate) {
          this.onDurationUpdate(this.duration);
        }
      }, 100);

      this.isRecording = true;
      return mimeType;
    } catch (error) {
      console.error('Failed to start recording:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  stopRecording(trackId = 'default') {
    const recorder = this.recorders.get(trackId);
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }

    const stream = this.streams.get(trackId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.streams.delete(trackId);
    }

    // Stop timer if no more recordings
    if (this.recorders.size === 0) {
      clearInterval(this.timerInterval);
      this.isRecording = false;
    }
  }

  stopAllRecordings() {
    this.recorders.forEach((recorder, trackId) => {
      this.stopRecording(trackId);
    });
  }

  getAudioLevels(trackId = 'default') {
    const analyser = this.analysers.get(trackId);
    if (!analyser) {
      return { volume: 0, frequency: 0 };
    }

    analyser.getByteFrequencyData(this.dataArray);

    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i] * this.dataArray[i];
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    const volume = rms / 255;

    // Calculate dominant frequency
    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      if (this.dataArray[i] > maxValue) {
        maxValue = this.dataArray[i];
        maxIndex = i;
      }
    }
    const frequency = maxIndex * this.audioContext.sampleRate / this.analysers.frequencyBinCount;

    return { volume, frequency };
  }

  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return '';
  }

  cleanup() {
    this.stopAllRecordings();

    this.analysers.forEach(analyser => {
      analyser.disconnect();
    });
    this.analysers.clear();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.recorders.clear();
    this.streams.clear();
    this.trackChunks.clear();
    this.chunks = [];
    this.isRecording = false;
    this.duration = 0;
  }
}

export default AudioCaptureService;
