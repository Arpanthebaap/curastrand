/**
 * CuraStrand Synthesized Patient Health Records (EHR) Resource
 * Standard on-device clinical records for emergency contextualization.
 */

export interface PatientHealthRecord {
  patientId: string;
  fullName: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  address: string;
  gps: { latitude: number; longitude: number };
  emergencyContacts: Array<{ name: string; relationship: string; phone: string }>;
  chronicConditions: string[];
  activeMedications: string[];
  allergies: string[];
  baselineVitals: {
    restingHeartRate: number;
    systolicBp: number;
    diastolicBp: number;
    spO2Percent: number;
  };
  dnrStatus: boolean;
  preferredLanguage: string;
}

export const SYNTHETIC_EHR_DATABASE: Record<string, PatientHealthRecord> = {
  'PT-1001': {
    patientId: 'PT-1001',
    fullName: 'Robert Sterling',
    age: 69,
    gender: 'M',
    address: '742 Evergreen Terrace, Seattle, WA 98101',
    gps: { latitude: 47.6062, longitude: -122.3321 },
    emergencyContacts: [
      { name: 'Eleanor Sterling', relationship: 'Spouse', phone: '+1-206-555-0192' }
    ],
    chronicConditions: [
      'Coronary Artery Disease (CAD)',
      'Previous NSTEMI (2021)',
      'Essential Hypertension',
      'Hyperlipidemia'
    ],
    activeMedications: [
      'Atorvastatin 40mg daily',
      'Metoprolol Succinate 50mg daily',
      'Aspirin 81mg daily',
      'Lisinopril 10mg daily'
    ],
    allergies: ['Penicillin (Anaphylactoid rash)', 'Codeine'],
    baselineVitals: {
      restingHeartRate: 68,
      systolicBp: 128,
      diastolicBp: 82,
      spO2Percent: 98
    },
    dnrStatus: false,
    preferredLanguage: 'en-US'
  },

  'PT-1002': {
    patientId: 'PT-1002',
    fullName: 'Elena Rostova',
    age: 78,
    gender: 'F',
    address: '1240 Pine Street, Apt 4B, San Francisco, CA 94109',
    gps: { latitude: 37.7915, longitude: -122.4167 },
    emergencyContacts: [
      { name: 'Dmitri Rostov', relationship: 'Son', phone: '+1-415-555-0144' }
    ],
    chronicConditions: [
      'Osteoporosis',
      'Atrial Fibrillation (Rate controlled)',
      'Mild Cognitive Impairment (MCI)'
    ],
    activeMedications: [
      'Apixaban (Eliquis) 5mg BID',
      'Diltiazem 120mg daily',
      'Alendronate 70mg weekly'
    ],
    allergies: ['Sulfa drugs'],
    baselineVitals: {
      restingHeartRate: 72,
      systolicBp: 134,
      diastolicBp: 84,
      spO2Percent: 97
    },
    dnrStatus: false,
    preferredLanguage: 'en-US'
  },

  'PT-1003': {
    patientId: 'PT-1003',
    fullName: 'Minh Nguyen',
    age: 64,
    gender: 'M',
    address: '882 Little Saigon Blvd, San Jose, CA 95112',
    gps: { latitude: 37.3382, longitude: -121.8863 },
    emergencyContacts: [
      { name: 'Anh Nguyen', relationship: 'Daughter', phone: '+1-408-555-0178' }
    ],
    chronicConditions: [
      'Type 2 Diabetes Mellitus',
      'Prior Transient Ischemic Attack (TIA 2023)',
      'Carotid Stenosis (left 50%)'
    ],
    activeMedications: [
      'Metformin 1000mg BID',
      'Clopidogrel 75mg daily',
      'Rosuvastatin 20mg daily'
    ],
    allergies: ['Iodinated contrast (Moderate pruritus)'],
    baselineVitals: {
      restingHeartRate: 74,
      systolicBp: 138,
      diastolicBp: 86,
      spO2Percent: 97
    },
    dnrStatus: false,
    preferredLanguage: 'vi-VN' // Non-English cross-cultural triage evaluation
  },

  'PT-1004': {
    patientId: 'PT-1004',
    fullName: 'Maya Patel',
    age: 7,
    gender: 'F',
    address: '350 Mission St, Fremont, CA 94539',
    gps: { latitude: 37.5485, longitude: -121.9886 },
    emergencyContacts: [
      { name: 'Sunita Patel', relationship: 'Mother', phone: '+1-510-555-0122' }
    ],
    chronicConditions: [
      'Severe Atopic Asthma',
      'IgE-Mediated Peanut & Tree Nut Anaphylaxis'
    ],
    activeMedications: [
      'Fluticasone Inhaler 44mcg BID',
      'Albuterol HFA PRN',
      'EpiPen Jr 0.15mg Auto-Injector (Active Prescription)'
    ],
    allergies: ['Peanuts (Fatal Anaphylaxis history)', 'Tree Nuts', 'Latex'],
    baselineVitals: {
      restingHeartRate: 95,
      systolicBp: 102,
      diastolicBp: 64,
      spO2Percent: 99
    },
    dnrStatus: false,
    preferredLanguage: 'en-US'
  }
};
