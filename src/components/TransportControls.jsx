import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Repeat, Plus } from 'lucide-react';
import useMusicStudioStore from '../store/useMusicStudioStore.js';
import audioCapture from '../services/audioCapture.js';

const TransportControls = () => {
  const {
    isPlaying,
    isRecording,
    isPaused,
    currentTime,
    totalDuration,
    loopEnabled,
    bpm,
    timeSignature,
    setPlaying,
    setRecording,
    setPaused,
    setCurrentTime,
    setLoopEnabled,
    setBpm,
    addTrack,
    addClip
  } = useMusicStudioStore();
  
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingInterval, setRecordingInterval] = useState(null);
  const audioCaptureRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    if (isRecording) return;
    setPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    
    if (isRecording && audioCaptureRef.current) {
      audioCapture.stopRecording('track-1');
    }
    
    setPlaying(false);
    setRecording(false);
    setPaused(false);
    setCurrentTime(0);
    setRecordingStartTime(null);
  };

  const handleRecord = async () => {
    if (isPlaying) return;
    
    if (!isRecording) {
      // Start recording
      try {
        // Initialize audio capture if not already
        if (!audioCaptureRef.current) {
          audioCaptureRef.current = audioCapture;
          await audioCapture.initialize();
        }
        
        // Set up callback to create clip when recording stops
        audioCaptureRef.current.onStop = (blob, trackId) => {
          const recordingDuration = currentTime - recordingStartTime;
          
          // Create clip from recording
          addClip(trackId, {
            id: `clip-${Date.now()}`,
            name: 'Recording',
            startTime: recordingStartTime,
            duration: recordingDuration,
            audioBlob: blob,
            midiNotes: []
          });
        };
        
        // Start recording on armed tracks
        const trackId = 'track-1'; // TODO: Get armed track
        await audioCapture.startRecording(trackId);
        
        setRecordingStartTime(currentTime);
        setRecording(true);
        
        // Update playhead during recording
        const interval = setInterval(() => {
          setCurrentTime(prev => prev + 0.1);
        }, 100);
        setRecordingInterval(interval);
        
        setPlaying(true);
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    } else {
      // Stop recording
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      
      audioCapture.stopRecording('track-1');
      setRecording(false);
      setPlaying(false);
      setRecordingStartTime(null);
    }
  };

  const handleLoopToggle = () => {
    setLoopEnabled(!loopEnabled);
  };

  const handleBpmChange = (e) => {
    const newBpm = parseInt(e.target.value);
    if (newBpm >= 20 && newBpm <= 300) {
      setBpm(newBpm);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700">
      {/* Left: Transport buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleStop}
          className="p-2 rounded hover:bg-gray-700 transition-colors"
          title="Stop"
        >
          <Square className="w-5 h-5 text-gray-300" />
        </button>

        <button
          onClick={handlePlay}
          className={`p-2 rounded transition-colors ${isPlaying ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-green-400" />
          ) : (
            <Play className="w-5 h-5 text-green-400" />
          )}
        </button>

        <button
          onClick={handleRecord}
          className={`p-2 rounded transition-colors ${isRecording ? 'bg-red-900' : 'hover:bg-gray-700'}`}
          title="Record"
        >
          <Square className={`w-5 h-5 ${isRecording ? 'text-red-400 animate-pulse' : 'text-gray-300'}`} />
        </button>

        <button
          onClick={() => setCurrentTime(0)}
          className="p-2 rounded hover:bg-gray-700 transition-colors"
          title="Rewind to start"
        >
          <RotateCcw className="w-5 h-5 text-gray-300" />
        </button>

        <button
          onClick={handleLoopToggle}
          className={`p-2 rounded transition-colors ${loopEnabled ? 'bg-blue-900' : 'hover:bg-gray-700'}`}
          title="Loop"
        >
          <Repeat className={`w-5 h-5 ${loopEnabled ? 'text-blue-400' : 'text-gray-300'}`} />
        </button>
      </div>

      {/* Center: Time display */}
      <div className="flex items-center gap-4">
        <div className="font-mono text-lg text-white">
          {formatTime(currentTime)}
        </div>
        <div className="text-gray-400">
          /
        </div>
        <div className="font-mono text-lg text-gray-400">
          {formatTime(totalDuration)}
        </div>
      </div>

      {/* Right: BPM and Time Signature */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">BPM</span>
          <input
            type="number"
            value={bpm}
            onChange={handleBpmChange}
            className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center"
            min="20"
            max="300"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Time</span>
          <span className="text-white font-mono">
            {timeSignature[0]}/{timeSignature[1]}
          </span>
        </div>

        <button className="p-2 rounded hover:bg-gray-700 transition-colors" title="Add Marker">
          <Plus className="w-5 h-5 text-gray-300" />
        </button>
      </div>
    </div>
  );
};

export default TransportControls;
