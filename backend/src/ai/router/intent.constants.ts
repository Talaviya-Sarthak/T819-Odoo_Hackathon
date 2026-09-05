import type { IntentCategory } from './intent.types';

/** Array of all valid intent category literals */
export const SUPPORTED_INTENTS: readonly IntentCategory[] = [
  'academic_doubt',
  'exam_timetable',
  'student_record',
  'university_rules',
  'analytics',
  'backtesting',
  'retail',
  'knowledge',
  'general',
] as const;

/** Default fallback intent when classification fails or confidence is too low */
export const DEFAULT_FALLBACK_INTENT: IntentCategory = 'general';

/** Minimum confidence score required to accept classification (below this falls back to general) */
export const MIN_INTENT_CONFIDENCE_THRESHOLD = 0.6;

/** Temperature set to 0.0 for deterministic classification */
export const INTENT_ROUTER_TEMPERATURE = 0.0;

/** Descriptions for each intent category used by the classification prompt */
export const INTENT_DESCRIPTIONS: Record<IntentCategory, string> = {
  academic_doubt:
    'Student is asking a course subject doubt, syllabus question, assignment clarification, or academic concept explanation.',
  exam_timetable:
    'Student is asking about exam schedules, hall ticket dates, mid-sem/end-sem timetables, seating arrangements, or re-evaluation dates.',
  student_record:
    'Student is asking about their personal attendance percentage, internal marks, grade sheet, CGPA/SGPA, backlog status, or fee receipt.',
  university_rules:
    'Student is asking about CHARUSAT university regulations, 75% attendance rules, leave application procedure, hostel rules, or campus facilities.',
  analytics:
    'User is asking to view, aggregate, compute, or compare statistical data, performance metrics, or dataset trends.',
  backtesting:
    'User is asking to run, configure, or inspect quantitative backtesting strategy performance or metrics.',
  retail:
    'User is asking for product recommendations or catalog searches.',
  knowledge:
    'User is asking general conceptual/domain questions from uploaded documentation.',
  general:
    'Greetings, conversational filler (hi, hello, thanks), meta questions about assistant capabilities, or ambiguous inputs.',
};
