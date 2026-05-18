import React from 'react';
import { Play, Pause, Square, RotateCcw, Repeat, Plus } from 'lucide-react';
import useMusicStudioStore from '../store/useMusicStudioStore.js';

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
    setBpm
  } = useMusicStudioStore();

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
    setPlaying(false);
    setRecording(false);
    setPaused(false);
    setCurrentTime(0);
  };

  const handleRecord = () => {
    if (isPlaying) return;
    setRecording(!isRecording);
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
