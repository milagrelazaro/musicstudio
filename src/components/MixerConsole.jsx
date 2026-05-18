import React from 'react';
import { Plus, Settings, Volume2 } from 'lucide-react';
import useMusicStudioStore from '../store/useMusicStudioStore.js';
import TrackStrip from './TrackStrip.jsx';

const MixerConsole = () => {
  const { tracks, addTrack, updateTrack, removeTrack, master, setMasterVolume, setMasterPan } = useMusicStudioStore();

  const handleAddTrack = () => {
    const newTrack = {
      id: `track-${Date.now()}`,
      name: `Track ${tracks.length + 1}`,
      type: 'audio',
      color: '#3B82F6',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      clips: [],
      effects: {
        eq: { low: 0, mid: 0, high: 0 },
        compressor: { threshold: -24, ratio: 4, attack: 0.005, release: 0.25 },
        reverb: { wet: 0, decay: 2, preDelay: 0.01 },
        delay: { wet: 0, time: 0.3, feedback: 0.3 }
      }
    };
    addTrack(newTrack);
  };

  const handleMasterVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setMasterVolume(newVolume);
  };

  const handleMasterPanChange = (e) => {
    const newPan = parseFloat(e.target.value);
    setMasterPan(newPan);
  };

  const masterVolumeDb = Math.round(20 * Math.log10(master.volume));
  const masterVolumePercent = Math.round(master.volume * 100);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Mixer Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Mixer Console</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddTrack}
            className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Track
          </button>
          <button className="p-2 hover:bg-gray-700 rounded transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Mixer Content */}
      <div className="flex-1 flex overflow-x-auto p-4 gap-4">
        {/* Track Strips */}
        {tracks.map((track) => (
          <TrackStrip
            key={track.id}
            track={track}
            onUpdate={updateTrack}
            onRemove={removeTrack}
          />
        ))}

        {/* Master Channel */}
        <div className="flex flex-col w-24 bg-gray-800 border-2 border-purple-500 rounded-lg overflow-hidden">
          <div className="p-2 border-b border-gray-700 bg-purple-900/30">
            <div className="text-sm text-white font-bold text-center">MASTER</div>
          </div>

          <div className="flex-1 flex flex-col items-center py-2 gap-2">
            {/* Volume Fader */}
            <div className="flex-1 flex flex-col items-center w-full px-2">
              <div className="text-xs text-gray-400 mb-1">{masterVolumeDb} dB</div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={master.volume}
                onChange={handleMasterVolumeChange}
                className="w-full h-32 -rotate-90 origin-center"
                style={{ transformOrigin: 'center' }}
              />
              <div className="text-xs text-gray-400 mt-1">{masterVolumePercent}%</div>
            </div>

            {/* Pan Knob */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-gray-400">Pan</div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={master.pan}
                onChange={handleMasterPanChange}
                className="w-12"
              />
              <div className="text-xs text-gray-400">
                {master.pan === 0 ? 'C' : master.pan < 0 ? 'L' : 'R'}
              </div>
            </div>
          </div>

          {/* Stereo Meter */}
          <div className="h-4 bg-gray-900 border-t border-gray-700 flex gap-1 p-1">
            <div className="flex-1 bg-gray-800 rounded relative overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500"
                style={{ height: `${masterVolumePercent * 0.9}%` }}
              />
            </div>
            <div className="flex-1 bg-gray-800 rounded relative overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500"
                style={{ height: `${masterVolumePercent * 0.85}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MixerConsole;
