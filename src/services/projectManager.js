// Project Manager Service for Save/Load Projects

class ProjectManager {
  constructor() {
    this.currentProject = null;
    this.projectVersion = '1.0.0';
  }

  createNewProject() {
    const project = {
      version: this.projectVersion,
      name: 'Untitled Project',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      bpm: 120,
      timeSignature: [4, 4],
      tracks: [],
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
      totalDuration: 0,
      metadata: {
        author: '',
        genre: '',
        comments: ''
      }
    };

    this.currentProject = project;
    return project;
  }

  saveProject(project) {
    const projectData = {
      version: this.projectVersion,
      name: project.name || 'Untitled Project',
      lastModified: new Date().toISOString(),
      bpm: project.bpm || 120,
      timeSignature: project.timeSignature || [4, 4],
      tracks: this.serializeTracks(project.tracks),
      master: project.master,
      totalDuration: project.totalDuration || 0,
      metadata: project.metadata || {}
    };

    const json = JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    
    return blob;
  }

  loadProject(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const json = e.target.result;
          const projectData = JSON.parse(json);
          
          const project = {
            version: projectData.version,
            name: projectData.name,
            createdAt: projectData.createdAt || new Date().toISOString(),
            lastModified: projectData.lastModified,
            bpm: projectData.bpm,
            timeSignature: projectData.timeSignature,
            tracks: this.deserializeTracks(projectData.tracks),
            master: projectData.master,
            totalDuration: projectData.totalDuration,
            metadata: projectData.metadata || {}
          };

          this.currentProject = project;
          resolve(project);
        } catch (error) {
          reject(new Error('Failed to parse project file: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read project file'));
      };
      
      reader.readAsText(file);
    });
  }

  serializeTracks(tracks) {
    return tracks.map(track => ({
      id: track.id,
      name: track.name,
      type: track.type,
      color: track.color,
      volume: track.volume,
      pan: track.pan,
      muted: track.muted,
      solo: track.solo,
      armed: track.armed,
      effects: track.effects,
      clips: this.serializeClips(track.clips)
    }));
  }

  deserializeTracks(tracksData) {
    return tracksData.map(track => ({
      ...track,
      clips: this.deserializeClips(track.clips)
    }));
  }

  serializeClips(clips) {
    if (!clips) return [];
    
    return clips.map(clip => ({
      id: clip.id,
      name: clip.name,
      startTime: clip.startTime,
      duration: clip.duration,
      audioBlob: null, // Don't serialize blob, will need to reload
      audioBuffer: null,
      midiNotes: clip.midiNotes || []
    }));
  }

  deserializeClips(clipsData) {
    if (!clipsData) return [];
    
    return clipsData.map(clip => ({
      ...clip,
      audioBlob: null,
      audioBuffer: null
    }));
  }

  exportProjectAsJSON(project) {
    const blob = this.saveProject(project);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async loadProjectFromFile(file) {
    const project = await this.loadProject(file);
    this.currentProject = project;
    return project;
  }

  getCurrentProject() {
    return this.currentProject;
  }

  updateProject(updates) {
    if (this.currentProject) {
      this.currentProject = {
        ...this.currentProject,
        ...updates,
        lastModified: new Date().toISOString()
      };
    }
    return this.currentProject;
  }

  validateProject(project) {
    const errors = [];

    if (!project.name) {
      errors.push('Project name is required');
    }

    if (!project.bpm || project.bpm < 20 || project.bpm > 300) {
      errors.push('BPM must be between 20 and 300');
    }

    if (!Array.isArray(project.tracks)) {
      errors.push('Tracks must be an array');
    }

    if (project.tracks) {
      project.tracks.forEach((track, index) => {
        if (!track.id) {
          errors.push(`Track ${index} is missing ID`);
        }
        if (!track.name) {
          errors.push(`Track ${index} is missing name`);
        }
      });
    }

    return errors;
  }

  getProjectStats(project) {
    const stats = {
      totalTracks: project.tracks?.length || 0,
      totalClips: 0,
      totalDuration: project.totalDuration || 0,
      audioTracks: 0,
      midiTracks: 0,
      armedTracks: 0
    };

    if (project.tracks) {
      project.tracks.forEach(track => {
        if (track.clips) {
          stats.totalClips += track.clips.length;
        }
        
        if (track.type === 'audio') {
          stats.audioTracks++;
        } else if (track.type === 'midi') {
          stats.midiTracks++;
        }
        
        if (track.armed) {
          stats.armedTracks++;
        }
      });
    }

    return stats;
  }

  cleanup() {
    this.currentProject = null;
  }
}

export default new ProjectManager();
