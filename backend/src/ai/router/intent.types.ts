/**
 * Intent Router Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

/** Supported intent categories for user queries */
export type IntentCategory =
  | 'academic_doubt'
  | 'exam_timetable'
  | 'student_record'
  | 'university_rules'
  | 'analytics'
  | 'backtesting'
  | 'retail'
  | 'knowledge'
  | 'general';

/** Structure returned by the Intent Classification Router */
export interface IntentResult {
  intent: IntentCategory;
  confidence: number;
  reason: string;
}

/** Few-shot example definition for classification training/prompting */
export interface IntentExample {
  query: string;
  intent: IntentCategory;
  description?: string;
}
