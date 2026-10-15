import { AcousticAnalysisResult } from '../types.js';

export const acousticAnalyzerToolDefinition = {
  name: 'acoustic_analyzer',
  description: 'Analyze ambient microphone streams from Alexa Echo devices or Bee wearables to detect acoustic emergency biomarkers (agonal gasping, stridor, aphasic speech dysarthria, non-verbal cries) and evaluate multi-lingual distress semantics.',
  inputSchema: {
    type: 'object',
    properties: {
      audio_stream_id: {
        type: 'string',
        description: 'Audio session or stream identifier'
      },
      ambient_mic_source: {
        type: 'string',
        enum: ['alexa_echo_show', 'echo_dot', 'bee_wearable', 'ring_intercom'],
        description: 'Hardware acoustic capture node'
      },
      detected_utterance: {
        type: 'string',
        description: 'Raw transcription or audio phonetic token sequence'
      },
      language_hint: {
        type: 'string',
        description: 'ISO language code hint (e.g. en, vi, es, hi)'
      },
      acoustic_profile_override: {
        type: 'string',
        enum: ['normal_speech', 'inspiratory_stridor', 'agonal_breathing', 'aphasic_dysarthria', 'pain_vocalization', 'silence_unresponsive'],
        description: 'Simulated acoustic pattern'
      }
    },
    required: ['audio_stream_id']
  }
};

export function executeAcousticAnalyzer(args: {
  audio_stream_id: string;
  ambient_mic_source?: string;
  detected_utterance?: string;
  language_hint?: string;
  acoustic_profile_override?: 'normal_speech' | 'inspiratory_stridor' | 'agonal_breathing' | 'aphasic_dysarthria' | 'pain_vocalization' | 'silence_unresponsive';
}): AcousticAnalysisResult {
  const utterance = (args.detected_utterance || '').toLowerCase();
  let classification: AcousticAnalysisResult['primaryClassification'] = 'normal_speech';
  let urgency = 0.1;
  let confidence = 0.94;
  let spl = 58;
  let intelligibility = 0.95;

  if (args.acoustic_profile_override) {
    classification = args.acoustic_profile_override;
  } else {
    // Acoustic biomarker inference rules
    if (utterance.includes('gasp') || utterance.includes('choking') || utterance.includes('can\'t breathe') || utterance.includes('không thở được')) {
      classification = 'agonal_breathing';
      urgency = 0.98;
      spl = 74;
      intelligibility = 0.35;
    } else if (utterance.includes('wheezing') || utterance.includes('stridor') || utterance.includes('tight throat')) {
      classification = 'inspiratory_stridor';
      urgency = 0.92;
      spl = 68;
      intelligibility = 0.52;
    } else if (utterance.includes('chest') || utterance.includes('crushing') || utterance.includes('pain') || utterance.includes('đau ngực') || utterance.includes('nhói ngực')) {
      classification = 'pain_vocalization';
      urgency = 0.88;
      spl = 76;
      intelligibility = 0.80;
    } else if (utterance.includes('arm weak') || utterance.includes('numb') || utterance.includes('slur') || utterance.includes('mất cảm giác')) {
      classification = 'aphasic_dysarthria';
      urgency = 0.89;
      spl = 52;
      intelligibility = 0.40;
    } else if (utterance.trim().length === 0) {
      classification = 'silence_unresponsive';
      urgency = 0.85;
      spl = 30;
      intelligibility = 0.0;
    }
  }

  // Adjust urgency if overridden
  if (classification === 'agonal_breathing') {
    urgency = 0.99;
    spl = 75;
    intelligibility = 0.25;
  } else if (classification === 'inspiratory_stridor') {
    urgency = 0.93;
    spl = 69;
    intelligibility = 0.50;
  } else if (classification === 'aphasic_dysarthria') {
    urgency = 0.90;
    spl = 50;
    intelligibility = 0.38;
  } else if (classification === 'pain_vocalization') {
    urgency = 0.85;
    spl = 78;
    intelligibility = 0.70;
  } else if (classification === 'silence_unresponsive') {
    urgency = 0.87;
    spl = 28;
    intelligibility = 0.0;
  }

  return {
    audioStreamId: args.audio_stream_id,
    timestamp: new Date().toISOString(),
    primaryClassification: classification,
    confidence,
    splDecibels: spl,
    speechIntelligibilityIndex: intelligibility,
    detectedLanguageOrDialect: args.language_hint || 'en-US',
    transcriptionOrAcousticPhonemes: args.detected_utterance || `[Acoustic Pattern: ${classification}]`,
    urgencyScore: urgency
  };
}
