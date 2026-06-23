import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from '@/hooks/use-toast';
import type {
  AssessmentFormFull,
  AssessmentSectionWithQuestions,
  AssessmentQuestionWithOptions,
  ResultLevel,
  DimensionScore,
} from '@/types/assessment';
import { PCGA_SCALE_LABELS, DIMENSION_SHORT_TITLES } from '@/types/assessment';

// ─── Answer state for each question ──────────────────────────────
interface AnswerState {
  text_answer?: string;
  selected_options?: string[];
  scale_value?: number;
}

// ─── Scale colour mapping ────────────────────────────────────────
// Premium minimalist theme: Stone -> Brown -> Red
const SCALE_COLORS: Record<number, string> = {
  1: 'bg-stone-200 text-stone-800',
  2: 'bg-stone-400 text-stone-900',
  3: 'bg-[#5C4033] text-white', // Brown
  4: 'bg-red-600 text-white',
  5: 'bg-red-800 text-white',
};

const SCALE_RING_COLORS: Record<number, string> = {
  1: 'ring-stone-200/50',
  2: 'ring-stone-400/50',
  3: 'ring-[#5C4033]/40',
  4: 'ring-red-600/40',
  5: 'ring-red-800/40',
};

// ─── Slide animation variants ────────────────────────────────────
const sectionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

// ─── Helper: check if a question is optional ─────────────────────
function isOptionalQuestion(
  question: AssessmentQuestionWithOptions,
  allQuestionsInSection: AssessmentQuestionWithOptions[],
): boolean {
  // paragraph questions that are open-ended (is_scored = false AND appear after scale questions)
  if (question.question_type === 'paragraph' && !question.is_scored) {
    const hasScaleQuestionBefore = allQuestionsInSection.some(
      (q) => q.question_type === 'scale' && q.sort_order < question.sort_order,
    );
    if (hasScaleQuestionBefore) return true;
  }
  return false;
}

// =================================================================
// Component
// =================================================================
export default function AssessmentQuiz() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const formId = searchParams.get('formId');

  // Data
  const [form, setForm] = useState<AssessmentFormFull | null>(null);
  const [loadingForm, setLoadingForm] = useState(true);

  // Navigation
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 = forward, -1 = backward

  // Answers keyed by question ID
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});

  // Submission
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch form ──────────────────────────────────────────────
  useEffect(() => {
    if (!formId || !user) return;

    const fetchForm = async () => {
      setLoadingForm(true);
      try {
        const { data, error } = await supabase
          .from('assessment_forms')
          .select(
            `
            *,
            assessment_sections (
              *,
              assessment_questions (
                *,
                assessment_options (*)
              )
            )
          `,
          )
          .eq('id', formId)
          .single();

        if (error) throw error;

        // Sort sections → questions → options by sort_order
        const sorted: AssessmentFormFull = {
          ...data,
          assessment_sections: (data.assessment_sections ?? [])
            .sort((a: AssessmentSectionWithQuestions, b: AssessmentSectionWithQuestions) => a.sort_order - b.sort_order)
            .map((section: AssessmentSectionWithQuestions) => ({
              ...section,
              assessment_questions: (section.assessment_questions ?? [])
                .sort((a: AssessmentQuestionWithOptions, b: AssessmentQuestionWithOptions) => a.sort_order - b.sort_order)
                .map((q: AssessmentQuestionWithOptions) => ({
                  ...q,
                  assessment_options: (q.assessment_options ?? []).sort(
                    (a, b) => a.sort_order - b.sort_order,
                  ),
                })),
            })),
        };

        setForm(sorted);
      } catch (err: any) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: err.message ?? 'ไม่สามารถโหลดแบบประเมินได้',
          variant: 'destructive',
        });
      } finally {
        setLoadingForm(false);
      }
    };

    fetchForm();
  }, [formId, user]);

  // ─── Derived values ──────────────────────────────────────────
  const sections = form?.assessment_sections ?? [];
  const totalSections = sections.length;
  const currentSection = sections[currentSectionIndex] as AssessmentSectionWithQuestions | undefined;
  const progressPercent = totalSections > 0 ? ((currentSectionIndex + 1) / totalSections) * 100 : 0;
  const isLastSection = currentSectionIndex === totalSections - 1;

  // ─── Answer helpers ──────────────────────────────────────────
  const updateAnswer = useCallback(
    (questionId: string, patch: Partial<AnswerState>) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], ...patch },
      }));
    },
    [],
  );

  // ─── Validation ──────────────────────────────────────────────
  const isSectionValid = useCallback((): boolean => {
    if (!currentSection) return false;
    const questions = currentSection.assessment_questions;

    return questions.every((q) => {
      // Skip optional questions
      if (isOptionalQuestion(q, questions)) return true;

      const ans = answers[q.id];
      switch (q.question_type) {
        case 'scale':
          return ans?.scale_value != null;
        case 'short_text':
        case 'paragraph':
          return (ans?.text_answer ?? '').trim().length > 0;
        case 'multi_select':
          return (ans?.selected_options ?? []).length > 0;
        case 'single_select':
          return (ans?.selected_options ?? []).length === 1;
        default:
          return true;
      }
    });
  }, [currentSection, answers]);

  // ─── Navigation handlers ─────────────────────────────────────
  const goNext = useCallback(() => {
    if (currentSectionIndex < totalSections - 1) {
      setDirection(1);
      setCurrentSectionIndex((i) => i + 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  }, [currentSectionIndex, totalSections]);

  const goBack = useCallback(() => {
    if (currentSectionIndex > 0) {
      setDirection(-1);
      setCurrentSectionIndex((i) => i - 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  }, [currentSectionIndex]);

  // ─── Submit ──────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!form || !user) return;
    setSubmitting(true);

    try {
      // 1. Calculate per-dimension weighted scores
      const dimensionScores: DimensionScore[] = [];

      for (const section of sections) {
        if (section.weight_percent <= 0) continue;

        const scoredQuestions = section.assessment_questions.filter((q) => q.is_scored);
        let rawScore = 0;

        for (const q of scoredQuestions) {
          const ans = answers[q.id];
          if (ans?.scale_value != null) {
            rawScore += ans.scale_value;
          }
        }

        const maxRawScore = scoredQuestions.length * 5; // always 25 for 5 questions
        const weight = section.weight_percent ?? 0;
        const weightedScore = maxRawScore > 0 ? (rawScore / maxRawScore) * weight : 0;

        dimensionScores.push({
          sectionId: section.id,
          title: section.title,
          shortTitle: DIMENSION_SHORT_TITLES[section.title] ?? section.title,
          weight: section.weight_percent,
          rawScore,
          maxRawScore,
          weightedScore,
        });
      }

      const totalWeightedScore = dimensionScores.reduce((sum, d) => sum + d.weightedScore, 0);

      // 2. Determine result level
      let resultLevel: ResultLevel;
      // Handle NaN fallback
      const safeScore = isNaN(totalWeightedScore) ? 0 : totalWeightedScore;
      
      if (safeScore <= (form.seed_max_percent ?? 40)) {
        resultLevel = 'seed';
      } else if (safeScore <= (form.sapling_max_percent ?? 70)) {
        resultLevel = 'sapling';
      } else {
        resultLevel = 'big_tree';
      }

      // 3. Insert response
      const { data: responseData, error: responseError } = await supabase
        .from('assessment_responses')
        .insert({
          form_id: form.id,
          user_id: user.id,
          total_score: Math.round(totalWeightedScore),
          max_possible_score: 100,
          score_percent: totalWeightedScore,
          result_level: resultLevel,
        })
        .select('id')
        .single();

      if (responseError) throw responseError;
      const responseId = responseData.id;

      // 4. Insert all individual answers
      const answerRows: Array<{
        response_id: string;
        question_id: string;
        text_answer: string | null;
        selected_options: string[] | null;
        scale_value: number | null;
        score: number;
      }> = [];

      for (const section of sections) {
        for (const q of section.assessment_questions) {
          const ans = answers[q.id];
          if (!ans) continue;

          answerRows.push({
            response_id: responseId,
            question_id: q.id,
            text_answer: ans.text_answer ?? null,
            selected_options: ans.selected_options?.length ? ans.selected_options : null,
            scale_value: ans.scale_value ?? null,
            score: ans.scale_value ?? 0,
          });
        }
      }

      if (answerRows.length > 0) {
        const { error: answerError } = await supabase
          .from('assessment_answers')
          .insert(answerRows);
        if (answerError) throw answerError;
      }

      toast({
        title: 'ส่งแบบประเมินสำเร็จ',
        description: 'กำลังไปยังหน้าผลลัพธ์...',
      });

      navigate(`/assessment/result?responseId=${responseId}`);
    } catch (err: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err.message ?? 'ไม่สามารถส่งแบบประเมินได้',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }, [form, user, sections, answers, navigate]);

  // ─── Question renderers ──────────────────────────────────────
  const renderQuestion = useCallback(
    (question: AssessmentQuestionWithOptions, allQuestions: AssessmentQuestionWithOptions[]) => {
      const ans = answers[question.id] ?? {};
      const optional = isOptionalQuestion(question, allQuestions);

      const handleAutoScroll = () => {
        const currentIndex = allQuestions.findIndex(q => q.id === question.id);
        if (currentIndex >= 0 && currentIndex < allQuestions.length - 1) {
          const nextId = allQuestions[currentIndex + 1].id;
          setTimeout(() => {
            const el = document.getElementById(`question-${nextId}`);
            if (el) {
              const y = el.getBoundingClientRect().top + window.scrollY - 100; // 100px offset for header
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }, 150);
        }
      };

      return (
        <div key={question.id} className="space-y-3">
          {/* Question header */}
          <div className="flex items-start gap-2">
            {question.question_number && (
              <span className="mt-0.5 shrink-0 font-semibold text-red-700">
                {question.question_number}
              </span>
            )}
            <p className="text-base font-semibold leading-relaxed tracking-tight text-black sm:text-lg">
              {question.question_text}
              {optional && (
                <span className="ml-2 text-xs font-normal text-stone-400 tracking-normal">(ไม่บังคับ)</span>
              )}
            </p>
          </div>

          {/* Render by type */}
          {question.question_type === 'short_text' && (
            <Input
              placeholder="พิมพ์คำตอบของคุณ..."
              value={ans.text_answer ?? ''}
              onChange={(e) => updateAnswer(question.id, { text_answer: e.target.value })}
              className="max-w-xl border-stone-200 focus-visible:ring-red-700"
            />
          )}

          {question.question_type === 'paragraph' && (
            <Textarea
              placeholder="พิมพ์คำตอบของคุณ..."
              value={ans.text_answer ?? ''}
              onChange={(e) => updateAnswer(question.id, { text_answer: e.target.value })}
              className="max-w-xl border-stone-200 focus-visible:ring-red-700"
              style={{ minHeight: 120 }}
            />
          )}

          {question.question_type === 'multi_select' && (
            <div className="grid gap-2 sm:grid-cols-2">
              {question.assessment_options.map((opt) => {
                const selected = (ans.selected_options ?? []).includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selected
                        ? 'border-red-700 bg-red-50/50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <Checkbox
                      checked={selected}
                      className="data-[state=checked]:bg-red-700 data-[state=checked]:border-red-700"
                      onCheckedChange={(checked) => {
                        const prev = ans.selected_options ?? [];
                        const next = checked
                          ? [...prev, opt.id]
                          : prev.filter((id) => id !== opt.id);
                        updateAnswer(question.id, { selected_options: next });
                      }}
                    />
                    <span className="text-sm text-black font-normal leading-relaxed">{opt.option_text}</span>
                  </label>
                );
              })}
            </div>
          )}

          {question.question_type === 'single_select' && (
            <RadioGroup
              value={ans.selected_options?.[0] ?? ''}
              onValueChange={(val) => {
                updateAnswer(question.id, { selected_options: [val] });
                handleAutoScroll();
              }}
              className="grid gap-2 sm:grid-cols-2"
            >
              {question.assessment_options.map((opt) => {
                const selected = ans.selected_options?.[0] === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selected
                        ? 'border-red-700 bg-red-50/50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <RadioGroupItem 
                      value={opt.id} 
                      id={opt.id} 
                      className="text-red-700 data-[state=checked]:border-red-700"
                    />
                    <Label htmlFor={opt.id} className="cursor-pointer text-sm text-black font-normal leading-relaxed">
                      {opt.option_text}
                    </Label>
                  </label>
                );
              })}
            </RadioGroup>
          )}

          {question.question_type === 'scale' && (
            <div className="flex flex-wrap items-end justify-center gap-3 py-2 sm:gap-5">
              {[1, 2, 3, 4, 5].map((val) => {
                const isSelected = ans.scale_value === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      updateAnswer(question.id, { scale_value: val });
                      handleAutoScroll();
                    }}
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-all sm:h-12 sm:w-12 ${
                        SCALE_COLORS[val]
                      } ${
                        isSelected
                          ? `ring-4 ${SCALE_RING_COLORS[val]} scale-110`
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {val}
                    </div>
                    <span
                      className={`max-w-[5rem] text-center text-[10px] leading-tight sm:text-xs ${
                        isSelected ? 'font-semibold text-black' : 'text-stone-500'
                      }`}
                    >
                      {PCGA_SCALE_LABELS[val]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    },
    [answers, updateAnswer],
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-700" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAFAFA] font-prompt">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h2 className="text-xl font-semibold text-black">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-stone-500">คุณต้องเข้าสู่ระบบก่อนทำแบบประเมิน</p>
          <Button onClick={() => navigate('/login')} className="mt-2 bg-red-700 hover:bg-red-800 text-white">
            เข้าสู่ระบบ
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading form
  if (loadingForm) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAFAFA] font-prompt">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-red-700" />
          <p className="text-sm text-stone-500">กำลังโหลดแบบประเมิน...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // No form found
  if (!form || totalSections === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAFAFA] font-prompt">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <h2 className="text-xl font-semibold text-black">ไม่พบแบบประเมิน</h2>
          <p className="text-stone-500">ไม่พบแบบประเมินที่ระบุ หรือยังไม่มีคำถามในแบบประเมินนี้</p>
          <Button variant="outline" onClick={() => navigate('/assessment')} className="border-stone-200 text-black hover:bg-stone-50">
            กลับหน้าประเมิน
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] font-prompt">
      <Navbar />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* ── Form title ──────────────────────────────────── */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">{form.title}</h1>
            {form.instructions && (
              <p className="mt-2 text-base leading-relaxed text-stone-500">{form.instructions}</p>
            )}
          </div>

          {/* ── Progress bar ────────────────────────────────── */}
          <div className="mb-6 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>
                ส่วนที่ {currentSectionIndex + 1} จาก {totalSections}
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-stone-200 [&>div]:bg-red-700" />
          </div>

          {/* ── Section content ─────────────────────────────── */}
          <AnimatePresence mode="wait" custom={direction}>
            {currentSection && (
              <motion.div
                key={currentSection.id}
                custom={direction}
                variants={sectionVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Section header */}
                <div className="mb-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-black">
                      {currentSection.title}
                    </h2>
                    {currentSection.weight_percent > 0 && (
                      <Badge variant="secondary" className="bg-[#5C4033]/10 text-[#5C4033] border border-[#5C4033]/20 hover:bg-[#5C4033]/20">
                        น้ำหนัก {currentSection.weight_percent}%
                      </Badge>
                    )}
                  </div>
                  {currentSection.description && (
                    <p className="mt-2 text-sm leading-relaxed text-stone-500">
                      {currentSection.description}
                    </p>
                  )}
                </div>

                {/* Questions */}
                <div className="space-y-6">
                  {currentSection.assessment_questions.map((q) => (
                    <div
                      key={q.id}
                      id={`question-${q.id}`}
                      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
                    >
                      {renderQuestion(q, currentSection.assessment_questions)}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Navigation buttons ──────────────────────────── */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentSectionIndex === 0}
              className="gap-1 border-stone-200 text-black hover:bg-stone-50"
            >
              <ChevronLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>

            {isLastSection ? (
              <Button
                onClick={handleSubmit}
                disabled={!isSectionValid() || submitting}
                className="gap-1 bg-red-700 hover:bg-red-800 text-white"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                ส่งแบบประเมิน
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!isSectionValid()}
                className="gap-1 bg-red-700 hover:bg-red-800 text-white"
              >
                ถัดไป
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
