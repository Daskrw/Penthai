// ============================================================
// Assessment Types — PenThai Community Assessment System
// ============================================================
// Defines all TypeScript interfaces and types used across the
// assessment feature: forms, sections, questions, options,
// responses, answers, and result-level configuration.
// ============================================================

// ------------------------------------
// Enums / Union Types
// ------------------------------------

/** The kind of input a question expects. */
export type QuestionType = 'short_text' | 'paragraph' | 'multi_select' | 'scale';

/** Community maturity level derived from the assessment score. */
export type ResultLevel = 'seed' | 'sapling' | 'big_tree';

// ------------------------------------
// Core Database Row Interfaces
// ------------------------------------

/** Top-level assessment form (maps to `assessment_forms` table). */
export interface AssessmentForm {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  is_active: boolean;
  /** Upper-bound percentage for the "seed" result level. */
  seed_max_percent: number;
  /** Upper-bound percentage for the "sapling" result level. */
  sapling_max_percent: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** A logical grouping of questions within a form. */
export interface AssessmentSection {
  id: string;
  form_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

/** A single question inside a section. */
export interface AssessmentQuestion {
  id: string;
  section_id: string;
  question_text: string;
  question_type: QuestionType;
  is_scored: boolean;
  scale_min: number;
  scale_max: number;
  scale_min_label: string | null;
  scale_max_label: string | null;
  sort_order: number;
  created_at: string;
}

/** A selectable option for `multi_select` questions. */
export interface AssessmentOption {
  id: string;
  question_id: string;
  option_text: string;
  sort_order: number;
  created_at: string;
}

/** A completed assessment submission (one per user per attempt). */
export interface AssessmentResponse {
  id: string;
  form_id: string;
  user_id: string | null;
  total_score: number;
  max_possible_score: number;
  score_percent: number;
  result_level: ResultLevel | null;
  completed_at: string;
}

/** An individual answer within a response. */
export interface AssessmentAnswer {
  id: string;
  response_id: string;
  question_id: string;
  text_answer: string | null;
  selected_options: string[] | null;
  scale_value: number | null;
  score: number;
  created_at: string;
}

// ------------------------------------
// Extended / Relational Types
// (Used when fetching nested data via Supabase joins)
// ------------------------------------

/** Question with its child options pre-loaded. */
export interface AssessmentQuestionWithOptions extends AssessmentQuestion {
  assessment_options: AssessmentOption[];
}

/** Section with its child questions (and their options) pre-loaded. */
export interface AssessmentSectionWithQuestions extends AssessmentSection {
  assessment_questions: AssessmentQuestionWithOptions[];
}

/** Fully-hydrated form: sections → questions → options. */
export interface AssessmentFormFull extends AssessmentForm {
  assessment_sections: AssessmentSectionWithQuestions[];
}

// ------------------------------------
// Result Level Configuration
// ------------------------------------

/**
 * Static metadata for each result level.
 * Used by the results page to render the appropriate icon,
 * colour scheme, and Thai-language description.
 */
export const RESULT_LEVELS: Record<
  ResultLevel,
  {
    label: string;
    thaiName: string;
    icon: string;
    color: string;
    bgGradient: string;
    description: string;
  }
> = {
  seed: {
    label: 'Seed Community',
    thaiName: 'ชุมชนเมล็ดพันธุ์',
    icon: '🌱',
    color: '#22c55e',
    bgGradient: 'from-green-400 to-emerald-600',
    description:
      'ชุมชนของคุณอยู่ในระยะเริ่มต้น มีศักยภาพที่รอการพัฒนา เปรียบเสมือนเมล็ดพันธุ์ที่พร้อมเติบโต ควรเริ่มจากการสร้างรากฐานที่แข็งแกร่ง',
  },
  sapling: {
    label: 'Sapling Community',
    thaiName: 'ชุมชนต้นกล้า',
    icon: '🌿',
    color: '#14b8a6',
    bgGradient: 'from-teal-400 to-cyan-600',
    description:
      'ชุมชนของคุณมีพื้นฐานที่ดีและกำลังเติบโต เปรียบเสมือนต้นกล้าที่เริ่มแตกกิ่งก้าน ควรเสริมสร้างจุดแข็งและพัฒนาจุดที่ยังขาด',
  },
  big_tree: {
    label: 'Big Tree Community',
    thaiName: 'ชุมชนไม้ใหญ่',
    icon: '🌳',
    color: '#059669',
    bgGradient: 'from-emerald-500 to-green-700',
    description:
      'ชุมชนของคุณมีความพร้อมสูง เปรียบเสมือนไม้ใหญ่ที่หยั่งรากลึก พร้อมเป็นต้นแบบและขยายผลสู่ระดับที่สูงขึ้น',
  },
};
