import React, { useRef, useEffect, useState } from 'react';
import { Scissors, Copy, Trash2, ZoomIn, ZoomOut, ChevronDown, ChevronUp } from 'lucide-react';
import useMusicStudioStore from '../store/useMusicStudioStore.js';
import waveformRenderer from '../services/waveformRenderer.js';
import AutomationLane from './AutomationLane.jsx';

const Timeline = ({ onClipSelect }) => {
  const { tracks, currentTime, totalDuration, bpm, setCurrentTime, updateTrack, addAutomationPoint, updateAutomationPoint, removeAutomationPoint } = useMusicStudioStore();
  const timelineRef = useRef(null);
  const [waveforms, setWaveforms] = useState({});
  const [expandedTracks, setExpandedTracks] = useState({});
  const [showAutomation, setShowAutomation] = useState({});
  const [selectedClip, setSelectedClip] = useState(null);

  const pixelsPerSecond = 50;
  const timelineWidth = Math.max(totalDuration * pixelsPerSecond, 2000);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / pixelsPerSecond;
    setCurrentTime(time);
  };

  const toggleTrackExpand = (trackId) => {
    setExpandedTracks(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  };

  const toggleAutomation = (trackId, parameter) => {
    setShowAutomation(prev => ({
      ...prev,
      [`${trackId}-${parameter}`]: !prev[`${trackId}-${parameter}`]
    }));
  };

  const renderGridLines = () => {
    const lines = [];
    const barDuration = 60 / bpm; // seconds per beat
    const totalBars = Math.ceil(totalDuration / barDuration);

    for (let i = 0; i <= totalBars; i++) {
      const time = i * barDuration;
      const x = time * pixelsPerSecond;
      const isBar = i % 4 === 0; // Every 4 beats = 1 bar

      lines.push(
        <div
          key={`grid-${i}`}
          className={`absolute top-0 bottom-0 ${isBar ? 'bg-gray-600' : 'bg-gray-700'}`}
          style={{
            left: `${x}px`,
            width: isBar ? '2px' : '1px'
          }}
        />
      );
    }

    return lines;
  };

  const renderTimeMarkers = () => {
    const markers = [];
    const markerInterval = 5; // seconds
    const totalMarkers = Math.ceil(totalDuration / markerInterval);

    for (let i = 0; i <= totalMarkers; i++) {
      const time = i * markerInterval;
      const x = time * pixelsPerSecond;

      markers.push(
        <div
          key={`marker-${i}`}
          className="absolute top-0 text-xs text-gray-400 font-mono"
          style={{ left: `${x}px` }}
        >
          {formatTime(time)}
        </div>
      );
    }

    return markers;
  };

  // Load waveforms for clips
  useEffect(() => {
    const loadWaveforms = async () => {
      const newWaveforms = {};
      
      for (const track of tracks) {
        if (track.clips) {
          for (const clip of track.clips) {
            if (clip.audioBlob && !waveforms[clip.id]) {
              try {
                const width = clip.duration * pixelsPerSecond;
                const waveformUrl = await waveformRenderer.renderWaveform(clip.audioBlob, {
                  width,
                  height: 60,
                  color: track.color
                });
                newWaveforms[clip.id] = waveformUrl;
              } catch (error) {
                console.error('Error loading waveform for clip:', clip.id, error);
              }
            }
          }
        }
      }
      
      if (Object.keys(newWaveforms).length > 0) {
        setWaveforms(prev => ({ ...prev, ...newWaveforms }));
      }
    };

    loadWaveforms();
  }, [tracks, pixelsPerSecond]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Timeline Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">Timeline</h2>
          <span className="text-sm text-gray-400">
            {tracks.length} track{tracks.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="Zoom In">
            <ZoomIn className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="Zoom Out">
            <ZoomOut className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="Cut">
            <Scissors className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="Copy">
            <Copy className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded transition-colors" title="Delete">
            <Trash2 className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="w-48 flex-shrink-0 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          {tracks.map((track) => (
            <div key={track.id}>
              <div
                className="h-24 px-4 py-2 border-b border-gray-700 flex items-center gap-2 cursor-pointer hover:bg-gray-700/50"
                style={{ backgroundColor: `${track.color}20` }}
                onClick={() => toggleTrackExpand(track.id)}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: track.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{track.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{track.type}</div>
                </div>
                <button className="p-1 hover:bg-gray-600 rounded">
                  {expandedTracks[track.id] ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Automation toggles */}
              {expandedTracks[track.id] && (
                <div className="px-4 py-2 bg-gray-900 border-b border-gray-700 space-y-1">
                  <button
                    onClick={() => toggleAutomation(track.id, 'volume')}
                    className={`w-full text-left px-2 py-1 rounded text-xs ${
                      showAutomation[`${track.id}-volume`] ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Volume Automation
                  </button>
                  <button
                    onClick={() => toggleAutomation(track.id, 'pan')}
                    className={`w-full text-left px-2 py-1 rounded text-xs ${
                      showAutomation[`${track.id}-pan`] ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Pan Automation
                  </button>
                </div>
              )}
            </div>
          ))}
          {tracks.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              No tracks yet
            </div>
          )}
        </div>

        {/* Timeline Area */}
        <div className="flex-1 overflow-auto relative">
          <div
            ref={timelineRef}
            className="relative min-h-full"
            style={{ width: `${timelineWidth}px` }}
            onClick={handleTimelineClick}
          >
            {/* Time Ruler */}
            <div className="h-6 bg-gray-800 border-b border-gray-700 relative">
              {renderTimeMarkers()}
            </div>

            {/* Grid Lines */}
            <div className="relative">
              {renderGridLines()}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
              style={{ left: `${currentTime * pixelsPerSecond}px` }}
            >
              <div className="absolute -top-1 -left-1.5 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500" />
            </div>

            {/* Tracks and Clips */}
            <div className="relative mt-2">
              {tracks.map((track, trackIndex) => (
                <div key={track.id}>
                  <div
                    className="h-24 border-b border-gray-800 relative"
                    style={{ backgroundColor: `${track.color}10` }}
                  >
                    {track.clips && track.clips.map((clip) => (
                      <div
                        key={clip.id}
                        className={`absolute top-2 bottom-2 rounded border-2 cursor-move overflow-hidden ${
                          selectedClip?.id === clip.id ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:opacity-90'
                        }`}
                        style={{
                          left: `${clip.startTime * pixelsPerSecond}px`,
                          width: `${clip.duration * pixelsPerSecond}px`,
                          backgroundColor: `${track.color}40`,
                          borderColor: track.color
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClip(clip);
                          if (onClipSelect) {
                            onClipSelect(track.id, clip.id);
                          }
                        }}
                      >
                        <div className="p-1 text-xs text-white font-medium truncate">
                          {clip.name || 'Clip'}
                        </div>
                        {/* Waveform */}
                        {waveforms[clip.id] ? (
                          <div className="flex-1 flex items-center justify-center">
                            <img
                              src={waveforms[clip.id]}
                              alt="Waveform"
                              className="w-full h-full object-cover"
                              style={{ height: '50px' }}
                            />
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-xs text-gray-400">
                              Loading waveform...
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Automation Lanes */}
                  {expandedTracks[track.id] && (
                    <div>
                      {showAutomation[`${track.id}-volume`] && (
                        <AutomationLane
                          trackId={track.id}
                          parameter="volume"
                          points={track.automation?.volume || []}
                          onPointAdd={(point) => addAutomationPoint(track.id, 'volume', point)}
                          onPointUpdate={(pointId, updates) => updateAutomationPoint(track.id, 'volume', pointId, updates)}
                          onPointRemove={(pointId) => removeAutomationPoint(track.id, 'volume', pointId)}
                          onClose={() => toggleAutomation(track.id, 'volume')}
                        />
                      )}
                      {showAutomation[`${track.id}-pan`] && (
                        <AutomationLane
                          trackId={track.id}
                          parameter="pan"
                          points={track.automation?.pan || []}
                          onPointAdd={(point) => addAutomationPoint(track.id, 'pan', point)}
                          onPointUpdate={(pointId, updates) => updateAutomationPoint(track.id, 'pan', pointId, updates)}
                          onPointRemove={(pointId) => removeAutomationPoint(track.id, 'pan', pointId)}
                          onClose={() => toggleAutomation(track.id, 'pan')}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
