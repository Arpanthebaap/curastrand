import { CPRMetronomeState } from '../types.js';

class CPRMetronomeService {
  private state: CPRMetronomeState = {
    isActive: false,
    targetBpm: 110,
    compressionCount: 0,
    currentCadenceGuidance: 'CPR Inactive',
    audioFeedbackEnabled: true
  };

  public getState(): CPRMetronomeState {
    return { ...this.state };
  }

  public control(action: 'start' | 'stop' | 'increment_count' | 'reset', targetBpm: number = 110): CPRMetronomeState {
    switch (action) {
      case 'start':
        this.state.isActive = true;
        this.state.targetBpm = targetBpm;
        this.state.compressionCount = 0;
        this.state.currentCadenceGuidance = 'Pacing 110 BPM. Place heel of hand on center of chest. Interlock fingers. Push hard and fast (2 inches / 5 cm deep). Allow full recoil.';
        break;

      case 'stop':
        this.state.isActive = false;
        this.state.currentCadenceGuidance = 'CPR Paused. Check pulse / breathing. Follow EMS instructions upon arrival.';
        break;

      case 'increment_count':
        if (this.state.isActive) {
          this.state.compressionCount += 1;
        }
        break;

      case 'reset':
        this.state.compressionCount = 0;
        break;
    }

    return this.getState();
  }
}

export const cprMetronomeService = new CPRMetronomeService();

export const cprMetronomeToolDefinition = {
  name: 'cpr_metronome',
  description: 'Manage bystander CPR audio-visual cadence pacing and coaching prompts (100-120 BPM American Heart Association standard) for sudden out-of-hospital cardiac arrest.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['start', 'stop', 'reset'],
        description: 'CPR metronome control action'
      },
      target_bpm: {
        type: 'number',
        description: 'Target compression rate (standard: 110 bpm)'
      }
    },
    required: ['action']
  }
};

export function executeCprMetronome(args: {
  action: 'start' | 'stop' | 'reset';
  target_bpm?: number;
}): CPRMetronomeState {
  return cprMetronomeService.control(args.action, args.target_bpm);
}
