// MIDI Service for Professional DAW

class MIDIService {
  constructor() {
    this.inputs = new Map();
    this.outputs = new Map();
    this.listeners = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      if (navigator.requestMIDIAccess) {
        const midiAccess = await navigator.requestMIDIAccess();
        
        // Handle device connection/disconnection
        midiAccess.onstatechange = (event) => {
          this.handleDeviceStateChange(event);
        };

        // Get existing inputs and outputs
        midiAccess.inputs.forEach((input) => {
          this.inputs.set(input.id, input);
        });

        midiAccess.outputs.forEach((output) => {
          this.outputs.set(output.id, output);
        });

        this.midiAccess = midiAccess;
        this.initialized = true;
      } else {
        console.warn('Web MIDI API not supported');
      }
    } catch (error) {
      console.error('Failed to initialize MIDI:', error);
      throw error;
    }
  }

  handleDeviceStateChange(event) {
    const { port } = event;

    if (port.type === 'input') {
      if (port.state === 'connected') {
        this.inputs.set(port.id, port);
      } else {
        this.inputs.delete(port.id);
      }
    } else if (port.type === 'output') {
      if (port.state === 'connected') {
        this.outputs.set(port.id, port);
      } else {
        this.outputs.delete(port.id);
      }
    }
  }

  getInputs() {
    return Array.from(this.inputs.values());
  }

  getOutputs() {
    return Array.from(this.outputs.values());
  }

  onMessage(inputId, callback) {
    if (!this.listeners.has(inputId)) {
      this.listeners.set(inputId, []);
    }
    this.listeners.get(inputId).push(callback);

    // Attach listener to input
    const input = this.inputs.get(inputId);
    if (input) {
      input.onmidimessage = (event) => {
        const message = this.parseMIDIMessage(event);
        this.listeners.get(inputId)?.forEach(cb => cb(message));
      };
    }
  }

  offMessage(inputId, callback) {
    if (this.listeners.has(inputId)) {
      const listeners = this.listeners.get(inputId);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  parseMIDIMessage(event) {
    const { data } = event;
    const status = data[0];
    const command = status >> 4;
    const channel = status & 0x0F;
    const note = data[1];
    const velocity = data[2];

    return {
      status,
      command,
      channel,
      note,
      velocity,
      timestamp: event.timeStamp,
      raw: data
    };
  }

  sendMessage(outputId, message) {
    const output = this.outputs.get(outputId);
    if (output) {
      output.send(message);
    }
  }

  sendNoteOn(outputId, note, velocity, channel = 0) {
    const status = 0x90 | channel;
    this.sendMessage(outputId, [status, note, velocity]);
  }

  sendNoteOff(outputId, note, velocity, channel = 0) {
    const status = 0x80 | channel;
    this.sendMessage(outputId, [status, note, velocity]);
  }

  sendControlChange(outputId, controller, value, channel = 0) {
    const status = 0xB0 | channel;
    this.sendMessage(outputId, [status, controller, value]);
  }

  sendPitchBend(outputId, value, channel = 0) {
    const status = 0xE0 | channel;
    const lsb = value & 0x7F;
    const msb = (value >> 7) & 0x7F;
    this.sendMessage(outputId, [status, lsb, msb]);
  }

  sendProgramChange(outputId, program, channel = 0) {
    const status = 0xC0 | channel;
    this.sendMessage(outputId, [status, program]);
  }

  cleanup() {
    this.listeners.clear();
    this.inputs.clear();
    this.outputs.clear();
    this.initialized = false;
  }
}

export default new MIDIService();
