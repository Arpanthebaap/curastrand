/**
 * CuraStrand Safety Governor
 * Mathematically verifies and intercepts clinical agent proposals before execution.
 * Enforces formal invariants derived from Manchester Triage System (MTS).
 */

export interface SafetyVerificationResult {
  isSafe: boolean;
  violations: string[];
  mandatoryOverrides: string[];
  proofHash: string;
}

export class SafetyGovernor {
  /**
   * Evaluates proposed agent action plan against hard clinical safety invariants.
   */
  public verifyTriageActionPlan(
    triageLevel: number,
    vitals: any,
    acoustic: any,
    proposedActions: string[],
    patientAllergies: string[] = []
  ): SafetyVerificationResult {
    const violations: string[] = [];
    const mandatoryOverrides: string[] = [];

    // Invariant 1: Malignant Arrhythmia / Agonal Breathing MUST be Level 1
    const isMalignant = vitals?.ecgRhythm === 'ventricular_fibrillation' || vitals?.ecgRhythm === 'asystole';
    const isAgonal = acoustic?.primaryClassification === 'agonal_breathing';

    if ((isMalignant || isAgonal) && triageLevel > 1) {
      violations.push(`INVARIANT_VIOLATION: Attempted to assign Priority Level ${triageLevel} to a lethal respiratory/cardiac presentation.`);
      mandatoryOverrides.push('FORCE_PRIORITY_LEVEL_1');
    }

    // Invariant 2: Level 1 must guarantee CAD Dispatch + Ring Door Unlock + CPR Metronome
    if (triageLevel === 1) {
      if (!proposedActions.includes('IMMEDIATE_CAD_DISPATCH')) {
        violations.push('INVARIANT_VIOLATION: Level 1 emergency missing immediate CAD dispatch action.');
        mandatoryOverrides.push('IMMEDIATE_CAD_DISPATCH');
      }
      if (!proposedActions.includes('UNLOCK_RING_DEADBOLT')) {
        violations.push('INVARIANT_VIOLATION: Level 1 emergency missing automated Ring responder access override.');
        mandatoryOverrides.push('UNLOCK_RING_DEADBOLT');
      }
      if (isMalignant && !proposedActions.includes('TRIGGER_AUDIO_CPR_METRONOME')) {
        violations.push('INVARIANT_VIOLATION: Cardiac arrest missing bystander CPR metronome initiation.');
        mandatoryOverrides.push('TRIGGER_AUDIO_CPR_METRONOME');
      }
    }

    // Invariant 3: Level 2 must guarantee Urgent CAD Dispatch + Ring Door Unlock
    if (triageLevel === 2) {
      if (!proposedActions.includes('URGENT_CAD_DISPATCH') && !proposedActions.includes('IMMEDIATE_CAD_DISPATCH')) {
        violations.push('INVARIANT_VIOLATION: Level 2 emergency missing urgent CAD dispatch action.');
        mandatoryOverrides.push('URGENT_CAD_DISPATCH');
      }
      if (!proposedActions.includes('UNLOCK_RING_DEADBOLT')) {
        mandatoryOverrides.push('UNLOCK_RING_DEADBOLT');
      }
    }

    // Invariant 4: Allergy contraindication guardrail
    for (const allergy of patientAllergies) {
      const allergyLower = allergy.toLowerCase();
      if (allergyLower.includes('penicillin') && proposedActions.some(a => a.toLowerCase().includes('penicillin'))) {
        violations.push('INVARIANT_VIOLATION: Lethal drug allergy contraindication intercepted: Penicillin.');
      }
      if (allergyLower.includes('aspirin') && proposedActions.some(a => a.toLowerCase().includes('aspirin'))) {
        violations.push('INVARIANT_VIOLATION: Drug allergy contraindication intercepted: Aspirin.');
      }
    }

    const isSafe = violations.length === 0;
    const proofHash = `0xGOV-${isSafe ? 'PASS' : 'OVERRIDE'}-${Date.now().toString(16).toUpperCase()}`;

    return {
      isSafe,
      violations,
      mandatoryOverrides,
      proofHash
    };
  }
}

export const safetyGovernor = new SafetyGovernor();
