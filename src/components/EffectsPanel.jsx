import React from 'react';
import { Sliders, X } from 'lucide-react';
import useMusicStudioStore from '../store/useMusicStudioStore.js';

const EffectsPanel = ({ trackId, onClose }) => {
  const { tracks, updateTrack, master, setMasterEffects } = useMusicStudioStore();
  
  const track = tracks.find(t => t.id === trackId);
  const isMaster = !trackId;
  const effects = isMaster ? master.effects : track?.effects;

  if (!effects && !isMaster) return null;

  const handleEffectChange = (effectName, param, value) => {
    if (isMaster) {
      setMasterEffects({
        [effectName]: { ...effects[effectName], [param]: value }
      });
    } else {
      updateTrack(trackId, {
        effects: {
          ...effects,
          [effectName]: { ...effects[effectName], [param]: value }
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">
            Effects - {isMaster ? 'Master' : track?.name}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Effects Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* EQ Section */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-bold text-white mb-3">Equalizer</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Low</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={effects.eq.low}
                onChange={(e) => handleEffectChange('eq', 'low', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{effects.eq.low} dB</div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Mid</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={effects.eq.mid}
                onChange={(e) => handleEffectChange('eq', 'mid', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{effects.eq.mid} dB</div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">High</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={effects.eq.high}
                onChange={(e) => handleEffectChange('eq', 'high', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{effects.eq.high} dB</div>
            </div>
          </div>
        </div>

        {/* Compressor Section */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-bold text-white mb-3">Compressor</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Threshold (dB)</label>
              <input
                type="range"
                min="-60"
                max="0"
                step="1"
                value={effects.compressor.threshold}
                onChange={(e) => handleEffectChange('compressor', 'threshold', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{effects.compressor.threshold} dB</div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ratio</label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={effects.compressor.ratio}
                onChange={(e) => handleEffectChange('compressor', 'ratio', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{effects.compressor.ratio}:1</div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Attack (s)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={effects.compressor.attack}
                onChange={(e) => handleEffectChange('compressor', 'attack', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{effects.compressor.attack}s</div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Release (s)</label>
              <input
                type="range"
                min="0.01"
                max="2"
                step="0.01"
                value={effects.compressor.release}
                onChange={(e) => handleEffectChange('compressor', 'release', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{effects.compressor.release}s</div>
            </div>
          </div>
        </div>

        {/* Reverb Section - only for tracks, not master */}
        {!isMaster && effects.reverb && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-bold text-white mb-3">Reverb</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Wet/Dry</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={effects.reverb.wet}
                  onChange={(e) => handleEffectChange('reverb', 'wet', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 text-center">{Math.round(effects.reverb.wet * 100)}%</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Decay (s)</label>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={effects.reverb.decay}
                  onChange={(e) => handleEffectChange('reverb', 'decay', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 text-center">{effects.reverb.decay}s</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Pre-delay (s)</label>
                <input
                  type="range"
                  min="0"
                  max="0.1"
                  step="0.001"
                  value={effects.reverb.preDelay}
                  onChange={(e) => handleEffectChange('reverb', 'preDelay', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 text-center">{effects.reverb.preDelay}s</div>
              </div>
            </div>
          </div>
        )}

        {/* Delay Section - only for tracks, not master */}
        {!isMaster && effects.delay && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-bold text-white mb-3">Delay</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Wet/Dry</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={effects.delay.wet}
                  onChange={(e) => handleEffectChange('delay', 'wet', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 text-center">{Math.round(effects.delay.wet * 100)}%</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Time (s)</label>
                <input
                  type="range"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={effects.delay.time}
                  onChange={(e) => handleEffectChange('delay', 'time', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 text-center">{effects.delay.time}s</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Feedback</label>
                <input
                  type="range"
                  min="0"
                  max="0.95"
                  step="0.01"
                  value={effects.delay.feedback}
                  onChange={(e) => handleEffectChange('delay', 'feedback', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 text-center">{Math.round(effects.delay.feedback * 100)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Limiter Section - only for master */}
        {isMaster && effects.limiter && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-bold text-white mb-3">Limiter</h3>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Threshold (dB)</label>
              <input
                type="range"
                min="-20"
                max="0"
                step="0.1"
                value={effects.limiter.threshold}
                onChange={(e) => handleEffectChange('limiter', 'threshold', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{effects.limiter.threshold} dB</div>
            </div>
          </div>
        )}

        {/* Stereo Width Section - only for master */}
        {isMaster && effects.stereoWidth !== undefined && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-bold text-white mb-3">Stereo Width</h3>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Width (%)</label>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={effects.stereoWidth}
                onChange={(e) => handleEffectChange('stereoWidth', undefined, parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{effects.stereoWidth}%</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EffectsPanel;
