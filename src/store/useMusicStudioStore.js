// Zustand store for Music Studio - Professional DAW

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const MAX_HISTORY = 50;

const useMusicStudioStore = create(
  devtools(
    (set, get) => ({
      // Transport
      isPlaying: false,
      isRecording: false,
      isPaused: false,
      currentTime: 0,
      totalDuration: 0,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 0,
      bpm: 120,
      timeSignature: [4, 4],
      
      // Tracks
      tracks: [],
      
      // Master channel
      master: {
        volume: 1.0,
        pan: 0.0,
        effects: {
          eq: { low: 0, mid: 0, high: 0 },
          compressor: { threshold: -18, ratio: 2, attack: 0.01, release: 0.5 },
          limiter: { threshold: -0.1 },
          stereoWidth: 100
        }
      },
      
      // Undo/Redo history
      history: [],
      historyIndex: -1,
      
      // Recording state (MVP)
      recordingDuration: 0,
      recordingMimeType: null,

      // Audio levels
      audioLevels: {
        volume: 0,
        frequency: 0
      },

      // Recorded audio
      recordedBlob: null,
      recordedUrl: null,

      // Conversion state
      isConverting: false,
      conversionProgress: 0,
      convertedBlob: null,
      convertedUrl: null,

      // Export settings
      exportFormat: 'wav', // wav, mp3, flac
      exportSampleRate: 48000,
      exportBitDepth: 24,
      exportChannels: 2,

      // Error handling
      error: null,

      // Actions - Transport
      setPlaying: (isPlaying) => set({ isPlaying }),
      setRecording: (isRecording) => set({ isRecording }),
      setPaused: (isPaused) => set({ isPaused }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setTotalDuration: (totalDuration) => set({ totalDuration }),
      setLoopEnabled: (loopEnabled) => set({ loopEnabled }),
      setLoopStart: (loopStart) => set({ loopStart }),
      setLoopEnd: (loopEnd) => set({ loopEnd }),
      setBpm: (bpm) => set({ bpm }),
      setTimeSignature: (timeSignature) => set({ timeSignature }),

      // Actions - Tracks with undo support
      addTrack: (track) => {
        const state = get();
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({ type: 'addTrack', data: { track }, state: { tracks: state.tracks } });
        
        set(state => ({
          tracks: [...state.tracks, track],
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1)
        }));
      },
      
      updateTrack: (trackId, updates) => {
        const state = get();
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        const oldTrack = state.tracks.find(t => t.id === trackId);
        newHistory.push({ type: 'updateTrack', data: { trackId, updates, oldTrack }, state: { tracks: state.tracks } });
        
        set(state => ({
          tracks: state.tracks.map(track => 
            track.id === trackId ? { ...track, ...updates } : track
          ),
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1)
        }));
      },
      
      removeTrack: (trackId) => {
        const state = get();
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        const removedTrack = state.tracks.find(t => t.id === trackId);
        newHistory.push({ type: 'removeTrack', data: { trackId, removedTrack }, state: { tracks: state.tracks } });
        
        set(state => ({
          tracks: state.tracks.filter(track => track.id !== trackId),
          history: newHistory.slice(-MAX_HISTORY),
          historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1)
        }));
      },

      addClip: (trackId, clip) => {
        set(state => ({
          tracks: state.tracks.map(track => {
            if (track.id === trackId) {
              return {
                ...track,
                clips: [...(track.clips || []), clip]
              };
            }
            return track;
          })
        }));
      },

      // Actions - Automation
      addAutomationPoint: (trackId, parameter, point) => {
        set(state => ({
          tracks: state.tracks.map(track => {
            if (track.id === trackId) {
              const automation = track.automation || {};
              const parameterPoints = automation[parameter] || [];
              return {
                ...track,
                automation: {
                  ...automation,
                  [parameter]: [...parameterPoints, { ...point, id: `point-${Date.now()}` }]
                }
              };
            }
            return track;
          })
        }));
      },

      updateAutomationPoint: (trackId, parameter, pointId, updates) => {
        set(state => ({
          tracks: state.tracks.map(track => {
            if (track.id === trackId && track.automation && track.automation[parameter]) {
              return {
                ...track,
                automation: {
                  ...track.automation,
                  [parameter]: track.automation[parameter].map(p => 
                    p.id === pointId ? { ...p, ...updates } : p
                  )
                }
              };
            }
            return track;
          })
        }));
      },

      removeAutomationPoint: (trackId, parameter, pointId) => {
        set(state => ({
          tracks: state.tracks.map(track => {
            if (track.id === trackId && track.automation && track.automation[parameter]) {
              return {
                ...track,
                automation: {
                  ...track.automation,
                  [parameter]: track.automation[parameter].filter(p => p.id !== pointId)
                }
              };
            }
            return track;
          })
        }));
      },

      // Actions - MIDI Notes
      addMidiNote: (trackId, clipId, note) => {
        set(state => ({
          tracks: state.tracks.map(track => {
            if (track.id === trackId) {
              return {
                ...track,
                clips: track.clips.map(clip => {
                  if (clip.id === clipId) {
                    return {
                      ...clip,
                      midiNotes: [...(clip.midiNotes || []), { ...note, id: `note-${Date.now()}` }]
                    };
                  }
                  return clip;
                })
              };
            }
            return track;
          })
        }));
      },

      updateMidiNote: (trackId, clipId, noteId, updates) => {
        set(state => ({
          tracks: state.tracks.map(track => {
            if (track.id === trackId) {
              return {
                ...track,
                clips: track.clips.map(clip => {
                  if (clip.id === clipId && clip.midiNotes) {
                    return {
                      ...clip,
                      midiNotes: clip.midiNotes.map(note =>
                        note.id === noteId ? { ...note, ...updates } : note
                      )
                    };
                  }
                  return clip;
                })
              };
            }
            return track;
          })
        }));
      },

      removeMidiNote: (trackId, clipId, noteId) => {
        set(state => ({
          tracks: state.tracks.map(track => {
            if (track.id === trackId) {
              return {
                ...track,
                clips: track.clips.map(clip => {
                  if (clip.id === clipId && clip.midiNotes) {
                    return {
                      ...clip,
                      midiNotes: clip.midiNotes.filter(note => note.id !== noteId)
                    };
                  }
                  return clip;
                })
              };
            }
            return track;
          })
        }));
      },

      // Actions - Master
      setMasterVolume: (volume) => set(state => ({
        master: { ...state.master, volume }
      })),
      setMasterPan: (pan) => set(state => ({
        master: { ...state.master, pan }
      })),
      setMasterEffects: (effects) => set(state => ({
        master: { ...state.master, effects: { ...state.master.effects, ...effects } }
      })),

      // Actions - Undo/Redo
      undo: () => {
        const state = get();
        if (state.historyIndex < 0) return;
        
        const action = state.history[state.historyIndex];
        let newState;
        
        switch (action.type) {
          case 'addTrack':
            newState = {
              tracks: action.state.tracks.filter(t => t.id !== action.data.track.id)
            };
            break;
          case 'updateTrack':
            newState = {
              tracks: action.state.tracks.map(t => 
                t.id === action.data.trackId ? action.data.oldTrack : t
              )
            };
            break;
          case 'removeTrack':
            newState = {
              tracks: [...action.state.tracks, action.data.removedTrack]
            };
            break;
          default:
            return;
        }
        
        set(state => ({
          ...newState,
          historyIndex: state.historyIndex - 1
        }));
      },
      
      redo: () => {
        const state = get();
        if (state.historyIndex >= state.history.length - 1) return;
        
        const action = state.history[state.historyIndex + 1];
        let newState;
        
        switch (action.type) {
          case 'addTrack':
            newState = {
              tracks: [...state.tracks, action.data.track]
            };
            break;
          case 'updateTrack':
            newState = {
              tracks: state.tracks.map(t => 
                t.id === action.data.trackId ? { ...t, ...action.data.updates } : t
              )
            };
            break;
          case 'removeTrack':
            newState = {
              tracks: state.tracks.filter(t => t.id !== action.data.trackId)
            };
            break;
          default:
            return;
        }
        
        set(state => ({
          ...newState,
          historyIndex: state.historyIndex + 1
        }));
      },
      
      canUndo: () => {
        return get().historyIndex >= 0;
      },
      
      canRedo: () => {
        const state = get();
        return state.historyIndex < state.history.length - 1;
      },

      // Actions - Recording (MVP)
      setRecordingDuration: (duration) => set({ recordingDuration: duration }),
      setRecordingMimeType: (mimeType) => set({ recordingMimeType: mimeType }),

      setAudioLevels: (volume, frequency) => set({ 
        audioLevels: { volume, frequency } 
      }),

      setRecordedBlob: (blob) => set({ 
        recordedBlob: blob,
        recordedUrl: blob ? URL.createObjectURL(blob) : null 
      }),

      setConverting: (isConverting) => set({ isConverting }),
      setConversionProgress: (progress) => set({ conversionProgress: progress }),
      setConvertedBlob: (blob) => set({ 
        convertedBlob: blob,
        convertedUrl: blob ? URL.createObjectURL(blob) : null 
      }),

      setExportFormat: (format) => set({ exportFormat: format }),
      setExportSampleRate: (sampleRate) => set({ exportSampleRate: sampleRate }),
      setExportBitDepth: (bitDepth) => set({ exportBitDepth: bitDepth }),
      setExportChannels: (channels) => set({ exportChannels: channels }),

      setError: (error) => set({ error }),

      resetRecording: () => set({
        isRecording: false,
        isPaused: false,
        recordingDuration: 0,
        recordingMimeType: null,
        audioLevels: { volume: 0, frequency: 0 },
        recordedBlob: null,
        recordedUrl: null,
        error: null
      }),

      resetConversion: () => set({
        isConverting: false,
        conversionProgress: 0,
        convertedBlob: null,
        convertedUrl: null,
        error: null
      }),

      cleanup: () => {
        const { recordedUrl, convertedUrl } = get();
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        if (convertedUrl) URL.revokeObjectURL(convertedUrl);
        get().resetRecording();
        get().resetConversion();
      }
    }),
    { name: 'MusicStudioStore' }
  )
);

export default useMusicStudioStore;
