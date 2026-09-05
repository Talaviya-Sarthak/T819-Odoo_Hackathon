import type { IntentCategory } from '../router/intent.types';
import type { NextAction, PipelineName } from './pipeline.types';

export interface PipelineMapping {
  pipeline: PipelineName;
  selectedTool: string;
  defaultNextAction: NextAction;
  description: string;
}

/** Immutable mapping of intent categories to execution pipelines & selected tool IDs */
export const INTENT_PIPELINE_MAP: Record<IntentCategory, PipelineMapping> = {
  academic_doubt: {
    pipeline: 'KNOWLEDGE_PIPELINE',
    selectedTool: 'academic_tool',
    defaultNextAction: 'CALL_RAG',
    description: 'Routes query to CHARUSAT syllabus & course knowledge base.',
  },
  exam_timetable: {
    pipeline: 'KNOWLEDGE_PIPELINE',
    selectedTool: 'academic_tool',
    defaultNextAction: 'CALL_RAG',
    description: 'Routes query to exam schedules & hall ticket guidelines.',
  },
  student_record: {
    pipeline: 'ANALYTICS_PIPELINE',
    selectedTool: 'student_records_tool',
    defaultNextAction: 'CALL_ANALYTICS_TOOL',
    description: 'Routes query to student academic record & transcript engine.',
  },
  university_rules: {
    pipeline: 'KNOWLEDGE_PIPELINE',
    selectedTool: 'academic_tool',
    defaultNextAction: 'CALL_RAG',
    description: 'Routes query to CHARUSAT academic handbook & university regulations.',
  },
  analytics: {
    pipeline: 'ANALYTICS_PIPELINE',
    selectedTool: 'analytics_tool',
    defaultNextAction: 'CALL_ANALYTICS_TOOL',
    description: 'Routes query to analytical engine suite.',
  },
  backtesting: {
    pipeline: 'BACKTEST_PIPELINE',
    selectedTool: 'backtesting_tool',
    defaultNextAction: 'CALL_BACKTEST_TOOL',
    description: 'Routes query to quantitative backtesting engine.',
  },
  retail: {
    pipeline: 'RETAIL_PIPELINE',
    selectedTool: 'retail_tool',
    defaultNextAction: 'CALL_PRODUCT_TOOL',
    description: 'Routes query to product search service.',
  },
  knowledge: {
    pipeline: 'KNOWLEDGE_PIPELINE',
    selectedTool: 'knowledge_tool',
    defaultNextAction: 'CALL_RAG',
    description: 'Routes query to vector index and knowledge retrieval pipeline.',
  },
  general: {
    pipeline: 'GENERAL_PIPELINE',
    selectedTool: 'general_tool',
    defaultNextAction: 'RESPOND_DIRECTLY',
    description: 'Routes query to direct conversational response handler.',
  },
};

/** Default fallback mapping if an intent is missing or unsupported */
export const FALLBACK_PIPELINE_MAPPING: PipelineMapping = {
  pipeline: 'GENERAL_PIPELINE',
  selectedTool: 'general_tool',
  defaultNextAction: 'RESPOND_DIRECTLY',
  description: 'Fallback pipeline triggered due to unsupported intent or planning error.',
};
