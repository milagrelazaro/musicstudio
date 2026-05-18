import React, { useState, useRef } from 'react';
import { Plus, Trash2, Play, Pause, Grid } from 'lucide-react';

const PianoRoll = ({ clip, onNoteAdd, onNoteRemove, onNoteUpdate }) => {
  const canvasRef = useRef(null);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);

  // Piano keys (C2 to C8)
  const pianoKeys = [
    { note: 'C', octave: 2, midi: 36 },
    { note: 'C#', octave: 2, midi: 37, isBlack: true },
    { note: 'D', octave: 2, midi: 38 },
    { note: 'D#', octave: 2, midi: 39, isBlack: true },
    { note: 'E', octave: 2, midi: 40 },
    { note: 'F', octave: 2, midi: 41 },
    { note: 'F#', octave: 2, midi: 42, isBlack: true },
    { note: 'G', octave: 2, midi: 43 },
    { note: 'G#', octave: 2, midi: 44, isBlack: true },
    { note: 'A', octave: 2, midi: 45 },
    { note: 'A#', octave: 2, midi: 46, isBlack: true },
    { note: 'B', octave: 2, midi: 47 },
    // ... continue for C3-C8
  ];

  // Generate all piano keys from C2 to C8
  const generatePianoKeys = () => {
    const keys = [];
    for (let octave = 2; octave <= 8; octave++) {
      const octaveKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      octaveKeys.forEach((note, index) => {
        const midiNote = (octave - 1) * 12 + index;
        keys.push({
          note,
          octave,
          midi: midiNote,
          isBlack: note.includes('#')
        });
      });
    }
    return keys;
  };

  const allPianoKeys = generatePianoKeys();
  const keyHeight = 20;
  const pixelsPerBeat = 40;
  const totalHeight = allPianoKeys.length * keyHeight;

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const beat = Math.floor(x / pixelsPerBeat);
    const keyIndex = Math.floor(y / keyHeight);
    const key = allPianoKeys[allPianoKeys.length - 1 - keyIndex];

    if (key) {
      const newNote = {
        id: `note-${Date.now()}`,
        note: key.note,
        octave: key.octave,
        midi: key.midi,
        startBeat: beat,
        duration: 1, // default 1 beat
        velocity: 127
      };

      onNoteAdd(newNote);
    }
  };

  const handleNoteClick = (note, e) => {
    e.stopPropagation();
    setSelectedNotes([note]);
  };

  const handleDeleteSelected = () => {
    selectedNotes.forEach(note => {
      onNoteRemove(note.id);
    });
    setSelectedNotes([]);
  };

  const getNoteColor = (note) => {
    const isSelected = selectedNotes.some(n => n.id === note.id);
    return isSelected ? '#8B5CF6' : '#3B82F6';
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Grid className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Piano Roll</h2>
          <span className="text-sm text-gray-400">
            {clip?.name || 'Untitled Clip'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedNotes.length === 0}
            className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Piano Roll Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Piano Keys */}
        <div className="w-16 flex-shrink-0 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          {allPianoKeys.slice().reverse().map((key) => (
            <div
              key={key.midi}
              className={`h-5 border-b border-gray-700 flex items-center justify-center text-xs ${
                key.isBlack ? 'bg-gray-900 text-gray-500' : 'bg-gray-800 text-gray-300'
              }`}
              style={{ height: `${keyHeight}px` }}
            >
              {key.note}
            </div>
          ))}
        </div>

        {/* Grid and Notes */}
        <div className="flex-1 overflow-auto relative">
          <div
            ref={canvasRef}
            className="relative cursor-crosshair"
            style={{ width: '2000px', height: `${totalHeight}px` }}
            onClick={handleCanvasClick}
          >
            {/* Grid Lines */}
            {Array.from({ length: 100 }).map((_, i) => (
              <React.Fragment key={`grid-${i}`}>
                <div
                  className={`absolute top-0 bottom-0 ${i % 4 === 0 ? 'bg-gray-600' : 'bg-gray-800'}`}
                  style={{
                    left: `${i * pixelsPerBeat}px`,
                    width: i % 4 === 0 ? '2px' : '1px'
                  }}
                />
                {/* Beat numbers */}
                {i % 4 === 0 && (
                  <div
                    className="absolute top-0 text-xs text-gray-500 font-mono"
                    style={{ left: `${i * pixelsPerBeat + 4}px` }}
                  >
                    {Math.floor(i / 4) + 1}
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Horizontal Grid Lines */}
            {allPianoKeys.slice().reverse().map((key, index) => (
              <div
                key={`hgrid-${key.midi}`}
                className="absolute left-0 right-0 border-b border-gray-800"
                style={{
                  top: `${index * keyHeight}px`,
                  height: `${keyHeight}px`
                }}
              />
            ))}

            {/* Notes */}
            {clip?.midiNotes?.map((note) => {
              const keyIndex = allPianoKeys.findIndex(k => k.midi === note.midi);
              const y = (allPianoKeys.length - 1 - keyIndex) * keyHeight;
              const x = note.startBeat * pixelsPerBeat;
              const width = note.duration * pixelsPerBeat;

              return (
                <div
                  key={note.id}
                  className="absolute rounded cursor-pointer hover:opacity-90 border-2"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${width}px`,
                    height: `${keyHeight - 2}px`,
                    backgroundColor: getNoteColor(note),
                    borderColor: selectedNotes.some(n => n.id === note.id) ? '#A78BFA' : '#60A5FA'
                  }}
                  onClick={(e) => handleNoteClick(note, e)}
                >
                  <div className="h-full flex items-center justify-center text-xs text-white font-medium">
                    {note.velocity}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center gap-4 text-sm text-gray-400">
        <span>Notes: {clip?.midiNotes?.length || 0}</span>
        <span>Duration: {clip?.duration || 0} beats</span>
        <span>BPM: 120</span>
      </div>
    </div>
  );
};

export default PianoRoll;
