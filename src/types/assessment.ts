// ============================================================
// Assessment Types — PCGA (Penthai Community Growth Assessment)
// ============================================================

// ------------------------------------
// Enums / Union Types
// ------------------------------------

/** The kind of input a question expects. */
export type QuestionType = 'short_text' | 'paragraph' | 'multi_select' | 'single_select' | 'scale';

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
  /** Upper-bound score for the "seed" result level (0-based, out of 100). */
  seed_max_percent: number;
  /** Upper-bound score for the "sapling/growth" result level (0-based, out of 100). */
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
  /** Weight percentage for scoring (e.g., 20 = 20%). 0 = not scored. */
  weight_percent: number;
  created_at: string;
}

/** A single question inside a section. */
export interface AssessmentQuestion {
  id: string;
  section_id: string;
  question_text: string;
  question_type: QuestionType;
  /** Display number, e.g. "1.1", "2.3" */
  question_number: string | null;
  is_scored: boolean;
  scale_min: number;
  scale_max: number;
  scale_min_label: string | null;
  scale_max_label: string | null;
  sort_order: number;
  created_at: string;
}

/** A selectable option for `multi_select` or `single_select` questions. */
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
// Dimension info for radar chart / results
// ------------------------------------
export interface DimensionScore {
  sectionId: string;
  title: string;
  shortTitle: string;
  weight: number;
  rawScore: number;
  maxRawScore: number;
  weightedScore: number;
}

// ------------------------------------
// PCGA Scale Labels (Likert 1-5)
// ------------------------------------
export const PCGA_SCALE_LABELS: Record<number, string> = {
  1: 'ยังไม่มี',
  2: 'มีเล็กน้อย',
  3: 'มีในระดับปานกลาง',
  4: 'มีอย่างชัดเจน',
  5: 'เป็นจุดเด่นของชุมชน',
};

// ------------------------------------
// Result Level Configuration
// ------------------------------------
export const RESULT_LEVELS: Record<
  ResultLevel,
  {
    label: string;
    thaiName: string;
    icon: string;
    color: string;
    bgGradient: string;
    scoreRange: string;
    description: string;
  }
> = {
  seed: {
    label: 'Seed Community',
    thaiName: 'ชุมชนเมล็ดพันธุ์',
    icon: '🌱',
    color: '#f59e0b',
    bgGradient: 'from-amber-500 to-orange-600',
    scoreRange: '0–49 คะแนน',
    description:
      'ชุมชนที่มีทุนทางวัฒนธรรม ภูมิปัญญาท้องถิ่น วิถีชีวิต และอัตลักษณ์ที่มีคุณค่า แต่ยังไม่ได้รับการพัฒนาอย่างเป็นระบบเพื่อสร้างมูลค่าทางเศรษฐกิจ จำเป็นต้องได้รับการค้นหาอัตลักษณ์ การรวบรวมองค์ความรู้ และการวางรากฐานการพัฒนา',
  },
  sapling: {
    label: 'Growth Community',
    thaiName: 'ชุมชนต้นกล้า',
    icon: '🌿',
    color: '#14b8a6',
    bgGradient: 'from-teal-500 to-emerald-600',
    scoreRange: '50–74 คะแนน',
    description:
      'ชุมชนที่เริ่มนำทุนทางวัฒนธรรมมาต่อยอดผ่านกระบวนการสร้างสรรค์ เกิดการพัฒนาสินค้า บริการ และกิจกรรมที่สะท้อนอัตลักษณ์ของชุมชน พร้อมเชื่อมโยงสู่ตลาดและการท่องเที่ยว',
  },
  big_tree: {
    label: 'Legacy Community',
    thaiName: 'ชุมชนไม้ใหญ่',
    icon: '🌳',
    color: '#059669',
    bgGradient: 'from-emerald-600 to-green-800',
    scoreRange: '75–100 คะแนน',
    description:
      'ชุมชนที่สามารถนำทุนทางวัฒนธรรมและความคิดสร้างสรรค์มาสร้างรายได้และพัฒนาคุณภาพชีวิตของคนในชุมชนได้อย่างยั่งยืน มีระบบการบริหารจัดการที่เข้มแข็ง มีมาตรฐานสินค้าและบริการ และสามารถถ่ายทอดองค์ความรู้ให้กับชุมชนอื่นได้',
  },
};

// Dimension short titles for radar chart
export const DIMENSION_SHORT_TITLES: Record<string, string> = {
  'มิติที่ 1: ทุนทางวัฒนธรรม': 'ทุนวัฒนธรรม',
  'มิติที่ 2: ความเข้มแข็งของชุมชน': 'ความเข้มแข็ง',
  'มิติที่ 3: ความคิดสร้างสรรค์และนวัตกรรม': 'สร้างสรรค์',
  'มิติที่ 4: ความพร้อมทางธุรกิจและตลาด': 'ธุรกิจ/ตลาด',
  'มิติที่ 5: มาตรฐานสินค้าและบริการ': 'มาตรฐาน',
  'มิติที่ 6: ความยั่งยืนและเครือข่าย': 'ยั่งยืน',
};
