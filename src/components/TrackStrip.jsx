import React from 'react';
import { Volume2, VolumeX, Mic, Music, MoreHorizontal } from 'lucide-react';

const TrackStrip = ({ track, onUpdate, onRemove }) => {
  const {
    id,
    name,
    type,
    color,
    volume,
    pan,
    muted,
    solo,
    armed
  } = track;

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    onUpdate(id, { volume: newVolume });
  };

  const handlePanChange = (e) => {
    const newPan = parseFloat(e.target.value);
    onUpdate(id, { pan: newPan });
  };

  const toggleMute = () => {
    onUpdate(id, { muted: !muted });
  };

  const toggleSolo = () => {
    onUpdate(id, { solo: !solo });
  };

  const toggleArm = () => {
    onUpdate(id, { armed: !armed });
  };

  const volumeDb = Math.round(20 * Math.log10(volume));
  const volumePercent = Math.round(volume * 100);

  return (
    <div className="flex flex-col w-20 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      {/* Track Header */}
      <div className="p-2 border-b border-gray-700">
        <div className="w-full h-2 rounded mb-1" style={{ backgroundColor: color }} />
        <div className="text-xs text-white font-medium truncate" title={name}>
          {name}
        </div>
        <div className="text-xs text-gray-400 capitalize">{type}</div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center py-2 gap-2">
        {/* Mute/Solo/Arm */}
        <div className="flex gap-1">
          <button
            onClick={toggleMute}
            className={`p-1 rounded ${muted ? 'bg-yellow-600' : 'hover:bg-gray-700'}`}
            title="Mute"
          >
            <VolumeX className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={toggleSolo}
            className={`p-1 rounded ${solo ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            title="Solo"
          >
            <Music className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={toggleArm}
            className={`p-1 rounded ${armed ? 'bg-red-600' : 'hover:bg-gray-700'}`}
            title="Record Arm"
          >
            <Mic className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Volume Fader */}
        <div className="flex-1 flex flex-col items-center w-full px-2">
          <div className="text-xs text-gray-400 mb-1">{volumeDb} dB</div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-32 -rotate-90 origin-center"
            style={{ transformOrigin: 'center' }}
          />
          <div className="text-xs text-gray-400 mt-1">{volumePercent}%</div>
        </div>

        {/* Pan Knob */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-gray-400">Pan</div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={pan}
            onChange={handlePanChange}
            className="w-12"
          />
          <div className="text-xs text-gray-400">
            {pan === 0 ? 'C' : pan < 0 ? 'L' : 'R'}
          </div>
        </div>

        {/* More Options */}
        <button className="p-1 hover:bg-gray-700 rounded" title="More options">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Meter */}
      <div className="h-2 bg-gray-900 border-t border-gray-700">
        <div
          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
          style={{ width: `${volumePercent}%` }}
        />
      </div>
    </div>
  );
};

export default TrackStrip;
