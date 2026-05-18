// Music Studio - Professional DAW Main Component

import React, { useState, useEffect } from 'react';
import { Music, LayoutDashboard, Layers, Sliders, Download, Save, FolderOpen, Undo, Redo, Music2 } from 'lucide-react';
import TransportControls from './components/TransportControls.jsx';
import Timeline from './components/Timeline.jsx';
import MixerConsole from './components/MixerConsole.jsx';
import EffectsPanel from './components/EffectsPanel.jsx';
import ExportDialog from './components/ExportDialog.jsx';
import ProjectDialog from './components/ProjectDialog.jsx';
import PianoRoll from './components/PianoRoll.jsx';
import useMusicStudioStore from './store/useMusicStudioStore.js';

const MusicStudio = () => {
  const { cleanup, undo, redo, canUndo, canRedo, tracks, addMidiNote, removeMidiNote, updateMidiNote } = useMusicStudioStore();
  const [activeTab, setActiveTab] = useState('timeline'); // timeline, mixer, piano
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [showEffects, setShowEffects] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState('save');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  React.useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const getSelectedClip = () => {
    if (!selectedTrackId || !selectedClipId) return null;
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track || !track.clips) return null;
    return track.clips.find(c => c.id === selectedClipId);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-3">
          <Music className="w-8 h-8 text-purple-500" />
          <div>
            <h1 className="text-xl font-bold">Music Studio Pro</h1>
            <p className="text-xs text-gray-400">Professional DAW</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-2 hover:bg-gray-700 rounded transition-colors disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-2 hover:bg-gray-700 rounded transition-colors disabled:opacity-30"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => {
              setProjectDialogMode('save');
              setShowProjectDialog(true);
            }}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={() => {
              setProjectDialogMode('load');
              setShowProjectDialog(true);
            }}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            Load
          </button>
          <button
            onClick={() => setShowEffects(!showEffects)}
            className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
              showEffects ? 'bg-purple-600' : 'hover:bg-gray-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Effects
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Effects (collapsible) */}
        {showEffects && (
          <div className="w-80 border-r border-gray-700 flex-shrink-0">
            <EffectsPanel
              trackId={selectedTrackId}
              onClose={() => setShowEffects(false)}
            />
          </div>
        )}

        {/* Center Panel - Timeline, Mixer, or Piano Roll */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                activeTab === 'timeline' ? 'bg-purple-600' : 'hover:bg-gray-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('mixer')}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                activeTab === 'mixer' ? 'bg-purple-600' : 'hover:bg-gray-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              Mixer
            </button>
            <button
              onClick={() => setActiveTab('piano')}
              disabled={!getSelectedClip()}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                activeTab === 'piano' ? 'bg-purple-600' : 'hover:bg-gray-700'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              title="Select a MIDI clip to open Piano Roll"
            >
              <Music2 className="w-4 h-4" />
              Piano Roll
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'timeline' ? (
              <Timeline 
                onClipSelect={(trackId, clipId) => {
                  setSelectedTrackId(trackId);
                  setSelectedClipId(clipId);
                }}
              />
            ) : activeTab === 'mixer' ? (
              <MixerConsole />
            ) : (
              <PianoRoll
                clip={getSelectedClip()}
                onNoteAdd={(note) => {
                  if (selectedTrackId && selectedClipId) {
                    addMidiNote(selectedTrackId, selectedClipId, note);
                  }
                }}
                onNoteRemove={(noteId) => {
                  if (selectedTrackId && selectedClipId) {
                    removeMidiNote(selectedTrackId, selectedClipId, noteId);
                  }
                }}
                onNoteUpdate={(noteId, updates) => {
                  if (selectedTrackId && selectedClipId) {
                    updateMidiNote(selectedTrackId, selectedClipId, noteId, updates);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Transport Controls - Bottom */}
      <TransportControls />

      {/* Export Dialog */}
      {showExport && (
        <ExportDialog onClose={() => setShowExport(false)} />
      )}

      {/* Project Dialog */}
      {showProjectDialog && (
        <ProjectDialog
          onClose={() => setShowProjectDialog(false)}
          mode={projectDialogMode}
        />
      )}
    </div>
  );
};

export default MusicStudio;
