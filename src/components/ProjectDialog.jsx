import React, { useState } from 'react';
import { X, Save, FolderOpen, FileText, Plus, Trash2 } from 'lucide-react';
import useMusicStudioStore from '../store/useMusicStudioStore.js';
import projectManager from '../services/projectManager.js';

const ProjectDialog = ({ onClose, mode = 'save' }) => {
  const { tracks, master, bpm, timeSignature, totalDuration } = useMusicStudioStore();
  const [projectName, setProjectName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    setIsSaving(true);

    const project = {
      name: projectName,
      bpm,
      timeSignature,
      tracks,
      master,
      totalDuration
    };

    try {
      projectManager.exportProjectAsJSON(project);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Save error:', error);
      setIsSaving(false);
      alert('Failed to save project: ' + error.message);
    }
  };

  const handleLoad = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);

    try {
      const project = await projectManager.loadProjectFromFile(file);
      // Update store with loaded project
      // This would need to be implemented in the store
      console.log('Loaded project:', project);
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Load error:', error);
      setIsLoading(false);
      alert('Failed to load project: ' + error.message);
    }
  };

  const handleNewProject = () => {
    const project = projectManager.createNewProject();
    // Update store with new project
    console.log('New project:', project);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">
              {mode === 'save' ? 'Save Project' : 'Project Manager'}
            </h2>
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
          {/* Save Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-700/50 rounded">
            <div>
              <div className="text-xs text-gray-400">Tracks</div>
              <div className="text-lg font-bold text-white">{tracks.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">BPM</div>
              <div className="text-lg font-bold text-white">{bpm}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Duration</div>
              <div className="text-lg font-bold text-white">{Math.floor(totalDuration / 60)}:{Math.floor(totalDuration % 60).toString().padStart(2, '0')}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Time Signature</div>
              <div className="text-lg font-bold text-white">{timeSignature[0]}/{timeSignature[1]}</div>
            </div>
          </div>

          {/* Load Section */}
          {mode === 'load' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Load Project
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleLoad}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <FolderOpen className="w-12 h-12 text-gray-400" />
                  <span className="text-gray-400">Click to select a project file</span>
                  <span className="text-xs text-gray-500">.json files only</span>
                </label>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleNewProject}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
            {mode === 'save' && (
              <button
                onClick={handleSave}
                disabled={isSaving || !projectName.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded text-white transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>

          {/* Progress */}
          {(isSaving || isLoading) && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">
                  {isSaving ? 'Saving...' : 'Loading...'}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 animate-pulse w-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDialog;
