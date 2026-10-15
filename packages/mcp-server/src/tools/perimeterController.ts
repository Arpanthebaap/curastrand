import { RingPerimeterState } from '../types.js';

class RingPerimeterManager {
  private state: RingPerimeterState = {
    deviceId: 'RING-PRO-FRONT-ENTRY-01',
    frontDoorLocked: true,
    emergencyStrobeActive: false,
    sirenActive: false,
    porchCameraStreaming: true,
    responderAccessGranted: false,
    temporaryAccessPin: '7429',
    lastEventDescription: 'Perimeter secure. Deadbolt engaged.'
  };

  public getState(): RingPerimeterState {
    return { ...this.state };
  }

  public executeAction(action: 'unlock_deadbolt' | 'lock_deadbolt' | 'flash_sos_beacon' | 'silence_beacon' | 'query_status'): RingPerimeterState {
    switch (action) {
      case 'unlock_deadbolt':
        this.state.frontDoorLocked = false;
        this.state.responderAccessGranted = true;
        this.state.emergencyStrobeActive = true;
        this.state.lastEventDescription = 'Emergency Deadbolt Override: Door Unlocked for First Responders. Emergency Strobe Engaged.';
        break;

      case 'lock_deadbolt':
        this.state.frontDoorLocked = true;
        this.state.responderAccessGranted = false;
        this.state.emergencyStrobeActive = false;
        this.state.lastEventDescription = 'Perimeter Re-locked. Deadbolt secure.';
        break;

      case 'flash_sos_beacon':
        this.state.emergencyStrobeActive = true;
        this.state.lastEventDescription = 'Ring Exterior Floodlights Pulsing Emergency Visual SOS Cadence.';
        break;

      case 'silence_beacon':
        this.state.emergencyStrobeActive = false;
        this.state.lastEventDescription = 'SOS Beacon Silenced.';
        break;

      case 'query_status':
      default:
        break;
    }

    return this.getState();
  }
}

export const ringPerimeterManager = new RingPerimeterManager();

export const perimeterControllerToolDefinition = {
  name: 'perimeter_controller',
  description: 'Control Ring perimeter security hardware (smart locks, floodlight strobes, doorbells) to facilitate instantaneous physical access for arriving emergency paramedics and mark the residence visually with an SOS beacon.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['unlock_deadbolt', 'lock_deadbolt', 'flash_sos_beacon', 'silence_beacon', 'query_status'],
        description: 'Perimeter hardware action'
      },
      ring_device_id: {
        type: 'string',
        description: 'Target Ring endpoint or door identifier'
      },
      authorization_proof: {
        type: 'string',
        description: 'Cryptographic proof hash from triage_evaluator justifying emergency override'
      }
    },
    required: ['action']
  }
};

export function executePerimeterController(args: {
  action: 'unlock_deadbolt' | 'lock_deadbolt' | 'flash_sos_beacon' | 'silence_beacon' | 'query_status';
  ring_device_id?: string;
  authorization_proof?: string;
}): RingPerimeterState {
  return ringPerimeterManager.executeAction(args.action);
}
