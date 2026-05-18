# Music Studio

Professional DAW (Digital Audio Workstation) for audio recording and mastering.

## Features

- **Audio Recording**: Web Audio API + MediaRecorder with multi-format support
- **MP3 Conversion**: lamejs for high-quality MP3 encoding
- **Real-time Monitoring**: Volume and frequency visualization
- **Mobile Ready**: Capacitor integration for Android/iOS

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: TailwindCSS v4
- **State Management**: Zustand
- **Audio Processing**: Web Audio API + Tone.js 15.0
- **MP3 Encoding**: lamejs
- **Mobile**: Capacitor 6.0

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Server runs on http://localhost:5175

## Build

```bash
npm run build
```

## Mobile Build

```bash
# Android
npm run android

# iOS
npm run ios
```

## Project Structure

```
src/
├── components/    # React components
├── services/      # Audio processing services
├── store/         # Zustand state management
├── App.jsx        # Main App component
├── MusicStudio.jsx # DAW main component
└── main.jsx       # Entry point
```

## Roadmap

### Phase 1 - Multi-Track Basic
- Multi-track recording
- Mixing console (volume, pan, mute, solo)
- Timeline with waveform visualization
- Transport controls

### Phase 2 - Effects & Processing
- Tone.js effects integration (EQ, compressor, reverb, delay)
- Effects panel per track
- Real-time effect processing

### Phase 3 - Advanced Editing
- Waveform editing (cut, trim, split)
- Fade in/out
- Clip manipulation
- Markers

### Phase 4 - MIDI & Virtual Instruments
- MIDI input/output
- Piano roll editor
- Virtual instruments
- MIDI recording

### Phase 5 - Automation
- Automation lanes
- Automation recording
- Curve editing

### Phase 6 - Professional Mastering
- Master channel with metering
- Professional EQ
- Multi-band compressor
- Stereo imaging
- Limiter with true peak detection

### Phase 7 - Professional Export
- WAV 24-bit/48kHz export
- MP3 with VBR/CBR
- FLAC lossless
- Stem export

### Phase 8 - Project Management
- Save/load projects
- Templates
- Undo/redo
- Keyboard shortcuts

## License

MIT
