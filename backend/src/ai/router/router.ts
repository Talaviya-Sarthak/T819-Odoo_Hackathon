import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { GROQ_LLM_MODEL } from '../constants';
import {
  DEFAULT_FALLBACK_INTENT,
  INTENT_ROUTER_TEMPERATURE,
  MIN_INTENT_CONFIDENCE_THRESHOLD,
  SUPPORTED_INTENTS,
} from './intent.constants';
import { INTENT_CLASSIFICATION_SYSTEM_PROMPT } from './intent.prompts';
import type { IntentCategory, IntentResult } from './intent.types';

export class IntentRouter {
  private model: ChatGroq | null = null;

  constructor() {
    this.initModel();
  }

  private initModel(): void {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) return;

    try {
      this.model = new ChatGroq({
        apiKey,
        model: GROQ_LLM_MODEL,
        temperature: INTENT_ROUTER_TEMPERATURE,
        maxTokens: 256,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize IntentRouter ChatGroq model');
      this.model = null;
    }
  }

  /**
   * Fast deterministic heuristic intent detector to ensure business data queries never fall through to general intent.
   */
  private detectHeuristicIntent(query: string): IntentResult | null {
    const q = query.toLowerCase();

    // Student Record Keywords (Attendance, CGPA, Marks, Hall ticket)
    if (
      q.includes('attendance') ||
      q.includes('cgpa') ||
      q.includes('sgpa') ||
      q.includes('mark') ||
      q.includes('grade') ||
      q.includes('transcript') ||
      q.includes('hall ticket') ||
      q.includes('enrollment') ||
      q.includes('result')
    ) {
      return {
        intent: 'student_record',
        confidence: 0.98,
        reason: 'Deterministic keyword match for student_record intent',
      };
    }

    // Exam Timetable & Schedule Keywords
    if (
      q.includes('exam') ||
      q.includes('timetable') ||
      q.includes('schedule') ||
      q.includes('mid-sem') ||
      q.includes('end-sem') ||
      q.includes('re-evaluation') ||
      q.includes('practical date') ||
      q.includes('viva')
    ) {
      return {
        intent: 'exam_timetable',
        confidence: 0.98,
        reason: 'Deterministic keyword match for exam_timetable intent',
      };
    }

    // University Regulations & Policy Keywords
    if (
      q.includes('rule') ||
      q.includes('regulation') ||
      q.includes('policy') ||
      q.includes('75%') ||
      q.includes('leave') ||
      q.includes('fee') ||
      q.includes('hostel') ||
      q.includes('charusat') ||
      q.includes('scholarship') ||
      q.includes('backlog')
    ) {
      return {
        intent: 'university_rules',
        confidence: 0.98,
        reason: 'Deterministic keyword match for university_rules intent',
      };
    }

    // Academic Subject Doubt & Syllabus Keywords
    if (
      q.includes('syllabus') ||
      q.includes('subject') ||
      q.includes('course') ||
      q.includes('assignment') ||
      q.includes('unit') ||
      q.includes('chapter') ||
      q.includes('prerequisite') ||
      q.includes('credit') ||
      q.includes('faculty') ||
      q.includes('doubt') ||
      q.includes('explain') ||
      q.includes('definition')
    ) {
      return {
        intent: 'academic_doubt',
        confidence: 0.98,
        reason: 'Deterministic keyword match for academic_doubt intent',
      };
    }

    // DealFlow360 Platform Overview & Knowledge Keywords
    if (
      q.includes('dealflow') ||
      q.includes('dealflow360') ||
      q.includes('what is this') ||
      q.includes('what can i do') ||
      q.includes('capabilities') ||
      q.includes('features') ||
      q.includes('portal') ||
      q.includes('handbook') ||
      q.includes('document') ||
      q.includes('policy') ||
      q.includes('refund') ||
      q.includes('return') ||
      q.includes('quotation') ||
      q.includes('negotiate') ||
      q.includes('negotiation') ||
      q.includes('discount') ||
      q.includes('tier') ||
      q.includes('file') ||
      q.includes('pdf') ||
      q.includes('help')
    ) {
      return {
        intent: 'knowledge',
        confidence: 0.98,
        reason: 'Keyword match for DealFlow360 knowledge and platform guidance',
      };
    }

    // Analytics Keywords (only when explicitly asking for analytical metrics/numbers/reports)
    if (
      q.includes('revenue') ||
      q.includes('units sold') ||
      q.includes('total sales') ||
      q.includes('top product') ||
      q.includes('highest revenue') ||
      q.includes('lowest revenue') ||
      q.includes('kpi') ||
      q.includes('dataset') ||
      q.includes('chart') ||
      q.includes('graph')
    ) {
      return {
        intent: 'analytics',
        confidence: 0.98,
        reason: 'Deterministic keyword match for analytics intent',
      };
    }

    return null;
  }

  /**
   * Classify user query intent into one of the 5 supported categories.
   *
   * @param query Raw user input text
   * @returns IntentResult carrying intent, confidence score, and rationale
   */
  public async classify(query: string): Promise<IntentResult> {
    const qTrimmed = (query || '').trim();

    if (!qTrimmed) {
      return {
        intent: 'general',
        confidence: 1.0,
        reason: 'Empty query defaults to general intent',
      };
    }

    // 1. Fast deterministic heuristic check first
    const heuristic = this.detectHeuristicIntent(qTrimmed);
    if (heuristic) {
      logger.info({ query: qTrimmed, intent: heuristic.intent, confidence: heuristic.confidence }, 'Intent Router (Heuristic Match)');
      return heuristic;
    }

    const fallbackResult: IntentResult = {
      intent: DEFAULT_FALLBACK_INTENT,
      confidence: 0.5,
      reason: 'Default fallback intent triggered due to parsing error or low confidence',
    };

    if (!this.model) {
      this.initModel();
      if (!this.model) return fallbackResult;
    }

    try {
      const messages = [
        new SystemMessage(INTENT_CLASSIFICATION_SYSTEM_PROMPT),
        new HumanMessage(qTrimmed),
      ];

      const response = await this.model.invoke(messages);
      const rawContent = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      const parsed = this.parseAndValidateResponse(rawContent);
      logger.info({ query: qTrimmed, intent: parsed.intent, confidence: parsed.confidence, reason: parsed.reason }, 'Intent Router (LLM Classified)');
      return parsed;
    } catch (error: any) {
      logger.error({ err: error, query: qTrimmed }, 'Error during IntentRouter classification');
      return fallbackResult;
    }
  }

  /**
   * Cleans JSON markdown fences, parses JSON, and validates intent against supported criteria.
   */
  private parseAndValidateResponse(rawContent: string): IntentResult {
    const fallbackResult: IntentResult = {
      intent: DEFAULT_FALLBACK_INTENT,
      confidence: 0.5,
      reason: 'Failed to parse JSON classification output',
    };

    try {
      let cleaned = rawContent.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);

      if (!parsed || typeof parsed !== 'object') {
        return fallbackResult;
      }

      let intent = String(parsed.intent || '').toLowerCase() as IntentCategory;
      let confidence = Number(parsed.confidence);
      let reason = String(parsed.reason || 'Intent classified');

      if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        confidence = 0.5;
      }

      if (!SUPPORTED_INTENTS.includes(intent)) {
        intent = DEFAULT_FALLBACK_INTENT;
        reason = `Unrecognized intent "${parsed.intent}", falling back to ${DEFAULT_FALLBACK_INTENT}`;
      }

      if (confidence < MIN_INTENT_CONFIDENCE_THRESHOLD) {
        intent = DEFAULT_FALLBACK_INTENT;
        reason = `Classification confidence (${confidence.toFixed(2)}) below threshold (${MIN_INTENT_CONFIDENCE_THRESHOLD}), falling back to ${DEFAULT_FALLBACK_INTENT}`;
      }

      return {
        intent,
        confidence,
        reason,
      };
    } catch (parseError) {
      logger.warn({ rawContent, err: parseError }, 'Failed to parse JSON from IntentRouter');
      return fallbackResult;
    }
  }
}

export const intentRouter = new IntentRouter();
