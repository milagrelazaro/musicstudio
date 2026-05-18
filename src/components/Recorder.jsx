// Recorder Component for Music Studio

import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Circle, Square, Play, Pause, Download, Trash2, Volume2 } from 'lucide-react';
import AudioCaptureService from '../services/audioCapture.js';
import audioConverter from '../services/audioConverter.js';
import useMusicStudioStore from '../store/useMusicStudioStore.js';

const Recorder = () => {
  const audioCaptureRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    isRecording,
    recordingDuration,
    audioLevels,
    recordedBlob,
    recordedUrl,
    isConverting,
    conversionProgress,
    convertedBlob,
    convertedUrl,
    exportFormat,
    exportBitRate,
    error,
    setRecording,
    setRecordingDuration,
    setAudioLevels,
    setRecordedBlob,
    setConverting,
    setConversionProgress,
    setConvertedBlob,
    setError,
    resetRecording,
    resetConversion,
    cleanup
  } = useMusicStudioStore();

  useEffect(() => {
    audioCaptureRef.current = new AudioCaptureService();

    audioCaptureRef.current.onDataAvailable = (data) => {
      console.log('Audio data available:', data.size, 'bytes');
    };

    audioCaptureRef.current.onStop = (blob) => {
      setRecordedBlob(blob);
    };

    audioCaptureRef.current.onDurationUpdate = (duration) => {
      setRecordingDuration(duration);
    };

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioCaptureRef.current) {
        audioCaptureRef.current.cleanup();
      }
    };
  }, [setRecordedBlob, setRecordingDuration]);

  const initializeAudio = async () => {
    try {
      await audioCaptureRef.current.initialize();
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      setError('Failed to access microphone. Please allow microphone access.');
      console.error('Audio initialization error:', err);
    }
  };

  const startRecording = async () => {
    try {
      if (!isInitialized) {
        await initializeAudio();
      }
      
      const mimeType = await audioCaptureRef.current.startRecording();
      setRecording(true);
      setError(null);

      // Start monitoring audio levels
      const monitorLevels = () => {
        if (isRecording) {
          const levels = audioCaptureRef.current.getAudioLevels();
          setAudioLevels(levels.volume, levels.frequency);
          animationFrameRef.current = requestAnimationFrame(monitorLevels);
        }
      };
      monitorLevels();
    } catch (err) {
      setError('Failed to start recording. Please try again.');
      console.error('Recording start error:', err);
    }
  };

  const stopRecording = () => {
    audioCaptureRef.current.stopRecording();
    setRecording(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const convertToMp3 = async () => {
    if (!recordedBlob) return;

    try {
      setConverting(true);
      setConversionProgress(0);
      setError(null);

      audioConverter.setBitRate(exportBitRate);
      const mp3Blob = await audioConverter.convertBlobToMp3(recordedBlob, (progress) => {
        setConversionProgress(progress);
      });

      setConvertedBlob(mp3Blob);
      setConverting(false);
    } catch (err) {
      setError('Failed to convert to MP3. Please try again.');
      setConverting(false);
      console.error('Conversion error:', err);
    }
  };

  const downloadRecording = () => {
    const blobToDownload = convertedBlob || recordedBlob;
    const urlToDownload = convertedUrl || recordedUrl;
    
    if (!blobToDownload || !urlToDownload) return;

    const format = exportFormat === 'mp3' && convertedBlob ? 'mp3' : 'wav';
    const a = document.createElement('a');
    a.href = urlToDownload;
    a.download = `recording_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteRecording = () => {
    resetRecording();
    resetConversion();
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const volumePercent = Math.round(audioLevels.volume * 100);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Mic className="w-6 h-6" />
          Audio Recorder
        </h2>
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
      </div>

      {/* Audio Level Meter */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <Volume2 className="w-5 h-5 text-gray-400" />
          <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
              style={{ width: `${volumePercent}%` }}
            />
          </div>
          <span className="text-sm text-gray-400 w-12 text-right">{volumePercent}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Frequency:</span>
          <span className="text-sm text-gray-300">{Math.round(audioLevels.frequency)} Hz</span>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {!recordedBlob ? (
          <div className="flex flex-col items-center gap-8">
            {/* Duration Display */}
            <div className="text-6xl font-mono font-bold">
              {formatDuration(recordingDuration)}
            </div>

            {/* Record Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 scale-110'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isRecording ? (
                <Square className="w-10 h-10" />
              ) : (
                <Circle className="w-10 h-10" />
              )}
            </button>

            <div className="text-sm text-gray-400">
              {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 text-red-500 animate-pulse">
                <Circle className="w-3 h-3 fill-current" />
                <span className="text-sm">Recording...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* Audio Player */}
            {recordedUrl && (
              <audio
                controls
                src={recordedUrl}
                className="w-full"
              />
            )}

            {/* Conversion Progress */}
            {isConverting && (
              <div className="w-full">
                <div className="flex justify-between text-sm mb-2">
                  <span>Converting to MP3...</span>
                  <span>{Math.round(conversionProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${conversionProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {!convertedBlob && !isConverting && (
                <button
                  onClick={convertToMp3}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Convert to MP3
                </button>
              )}

              {(convertedBlob || !isConverting) && (
                <button
                  onClick={downloadRecording}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
              )}

              <button
                onClick={deleteRecording}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            </div>

            {/* File Info */}
            <div className="text-sm text-gray-400">
              {recordedBlob && (
                <div>
                  Size: {(recordedBlob.size / 1024 / 1024).toFixed(2)} MB
                  {convertedBlob && (
                    <span className="ml-4">
                      MP3: {(convertedBlob.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recorder;
