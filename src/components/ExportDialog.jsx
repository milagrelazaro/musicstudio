import React, { useState } from 'react';
import { X, Download, FileAudio, Music } from 'lucide-react';
import useMusicStudioStore from '../store/useMusicStudioStore.js';
import audioExporter from '../services/audioExporter.js';

const ExportDialog = ({ onClose }) => {
  const { tracks, master, exportFormat, exportSampleRate, exportBitDepth, exportChannels, setExportFormat, setExportSampleRate, setExportBitDepth, setExportChannels } = useMusicStudioStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStems, setExportStems] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      const project = {
        tracks,
        master,
        totalDuration: tracks.reduce((max, track) => {
          if (track.clips && track.clips.length > 0) {
            return Math.max(max, ...track.clips.map(c => c.startTime + c.duration));
          }
          return max;
        }, 0)
      };

      if (exportStems) {
        // Export stems
        const stems = await audioExporter.exportStems(tracks, {
          format: exportFormat,
          sampleRate: exportSampleRate,
          bitDepth: exportBitDepth
        });

        setExportProgress(50);

        // Download each stem
        for (const stem of stems) {
          const url = URL.createObjectURL(stem.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${stem.trackName}.${stem.format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        setExportProgress(100);
      } else {
        // Export mix
        const blob = await audioExporter.exportProject(project, {
          format: exportFormat,
          sampleRate: exportSampleRate,
          bitDepth: exportBitDepth
        });

        setExportProgress(100);

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `music_studio_export.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      alert('Export failed: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Export Project</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['wav', 'mp3', 'flac'].map((format) => (
                <button
                  key={format}
                  onClick={() => setExportFormat(format)}
                  className={`p-3 rounded border-2 transition-colors ${
                    exportFormat === format
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-gray-600 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <FileAudio className="w-5 h-5" />
                    <span className="text-sm font-medium uppercase">{format}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sample Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sample Rate
            </label>
            <select
              value={exportSampleRate}
              onChange={(e) => setExportSampleRate(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value={44100}>44.1 kHz</option>
              <option value={48000}>48.0 kHz</option>
              <option value={96000}>96.0 kHz</option>
            </select>
          </div>

          {/* Bit Depth */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bit Depth
            </label>
            <select
              value={exportBitDepth}
              onChange={(e) => setExportBitDepth(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              disabled={exportFormat === 'mp3'}
            >
              <option value={16}>16-bit</option>
              <option value={24}>24-bit</option>
              <option value={32}>32-bit</option>
            </select>
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Channels
            </label>
            <select
              value={exportChannels}
              onChange={(e) => setExportChannels(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value={1}>Mono</option>
              <option value={2}>Stereo</option>
            </select>
          </div>

          {/* Export Stems */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="exportStems"
              checked={exportStems}
              onChange={(e) => setExportStems(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="exportStems" className="text-sm text-gray-300">
              Export as Stems (separate tracks)
            </label>
          </div>

          {/* Progress */}
          {isExporting && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Exporting...</span>
                <span className="text-white">{exportProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors disabled:opacity-50"
          >
            <Music className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
