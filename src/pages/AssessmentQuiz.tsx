import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import type {
  AssessmentFormFull,
  AssessmentSectionWithQuestions,
  AssessmentQuestionWithOptions,
  ResultLevel,
} from "@/types/assessment";

// Flatten sections+questions into a linear list for navigation
interface FlatQuestion {
  question: AssessmentQuestionWithOptions;
  sectionTitle: string;
  sectionDescription: string | null;
  globalIndex: number;
  isFirstInSection: boolean;
}

// Answer state for each question
interface AnswerState {
  text_answer?: string;
  selected_options?: string[];
  scale_value?: number;
}

const AssessmentQuiz = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const formId = searchParams.get("formId");

  const [form, setForm] = useState<AssessmentFormFull | null>(null);
  const [flatQuestions, setFlatQuestions] = useState<FlatQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Fetch form data
  useEffect(() => {
    if (!formId) return;
    const fetchForm = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("assessment_forms")
        .select(`
          *,
          assessment_sections (
            *,
            assessment_questions (
              *,
              assessment_options (*)
            )
          )
        `)
        .eq("id", formId)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast({
          title: "ไม่พบแบบประเมิน",
          description: "ไม่สามารถโหลดแบบประเมินได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        });
        navigate("/assessment");
        return;
      }

      // Sort sections and questions by sort_order
      const sortedForm = {
        ...data,
        assessment_sections: (data.assessment_sections || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((section: any) => ({
            ...section,
            assessment_questions: (section.assessment_questions || [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((q: any) => ({
                ...q,
                assessment_options: (q.assessment_options || []).sort(
                  (a: any, b: any) => a.sort_order - b.sort_order
                ),
              })),
          })),
      } as AssessmentFormFull;

      setForm(sortedForm);

      // Flatten into linear question list
      const flat: FlatQuestion[] = [];
      let globalIdx = 0;
      for (const section of sortedForm.assessment_sections) {
        let isFirst = true;
        for (const question of section.assessment_questions) {
          flat.push({
            question,
            sectionTitle: section.title,
            sectionDescription: section.description,
            globalIndex: globalIdx,
            isFirstInSection: isFirst,
          });
          isFirst = false;
          globalIdx++;
        }
      }
      setFlatQuestions(flat);
      setLoading(false);
    };

    fetchForm();
  }, [formId, navigate]);

  const currentQuestion = flatQuestions[currentIndex];
  const totalQuestions = flatQuestions.length;
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const updateAnswer = useCallback((questionId: string, update: Partial<AnswerState>) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...update },
    }));
  }, []);

  const canProceed = useCallback(() => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.question.id];
    const qType = currentQuestion.question.question_type;

    if (qType === "scale") {
      return answer?.scale_value !== undefined && answer.scale_value !== null;
    }
    if (qType === "short_text") {
      return !!answer?.text_answer?.trim();
    }
    if (qType === "paragraph") {
      return !!answer?.text_answer?.trim();
    }
    if (qType === "multi_select") {
      return (answer?.selected_options?.length || 0) > 0;
    }
    return true;
  }, [currentQuestion, answers]);

  const goNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!form || !user) return;
    setSubmitting(true);

    try {
      // Calculate score from scale questions
      let totalScore = 0;
      let maxPossibleScore = 0;

      for (const fq of flatQuestions) {
        if (fq.question.is_scored && fq.question.question_type === "scale") {
          maxPossibleScore += fq.question.scale_max;
          const answer = answers[fq.question.id];
          if (answer?.scale_value) {
            totalScore += answer.scale_value;
          }
        }
      }

      const scorePercent = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

      // Determine result level
      let resultLevel: ResultLevel = "big_tree";
      if (scorePercent <= form.seed_max_percent) {
        resultLevel = "seed";
      } else if (scorePercent <= form.sapling_max_percent) {
        resultLevel = "sapling";
      }

      // Insert response
      const { data: response, error: responseError } = await supabase
        .from("assessment_responses")
        .insert({
          form_id: form.id,
          user_id: user.id,
          total_score: totalScore,
          max_possible_score: maxPossibleScore,
          score_percent: Math.round(scorePercent * 100) / 100,
          result_level: resultLevel,
        })
        .select("id")
        .single();

      if (responseError || !response) {
        throw new Error(responseError?.message || "Failed to save response");
      }

      // Insert individual answers
      const answerRows = flatQuestions.map((fq) => {
        const answer = answers[fq.question.id] || {};
        const score =
          fq.question.is_scored && fq.question.question_type === "scale"
            ? answer.scale_value || 0
            : 0;

        return {
          response_id: response.id,
          question_id: fq.question.id,
          text_answer: answer.text_answer || null,
          selected_options: answer.selected_options || null,
          scale_value: answer.scale_value ?? null,
          score,
        };
      });

      const { error: answersError } = await supabase
        .from("assessment_answers")
        .insert(answerRows);

      if (answersError) {
        console.error("Error saving answers:", answersError);
      }

      navigate(`/assessment/result?responseId=${response.id}`);
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกผลประเมินได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Auth loading
  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">กรุณาเข้าสู่ระบบ</h2>
            <p className="text-muted-foreground">คุณต้องเข้าสู่ระบบก่อนทำแบบประเมิน</p>
            <Button onClick={() => navigate("/auth")}>เข้าสู่ระบบ</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Loading form
  if (loading || !form || flatQuestions.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">กำลังโหลดแบบประเมิน...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Progress Bar */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {form.title}
              </span>
              <span className="text-sm font-semibold text-primary">
                {currentIndex + 1} / {totalQuestions}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        {/* Question Area */}
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -80 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Section Header (only on first question of each section) */}
              {currentQuestion.isFirstInSection && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 text-center"
                >
                  <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-3">
                    {currentQuestion.sectionTitle}
                  </div>
                  {currentQuestion.sectionDescription && (
                    <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                      {currentQuestion.sectionDescription}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Question Card */}
              <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-10">
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-8 leading-relaxed">
                  <span className="text-primary font-bold mr-2">
                    {currentIndex + 1}.
                  </span>
                  {currentQuestion.question.question_text}
                </h2>

                {/* Answer Input based on question type */}
                <QuestionInput
                  question={currentQuestion.question}
                  answer={answers[currentQuestion.question.id] || {}}
                  onUpdate={(update) =>
                    updateAnswer(currentQuestion.question.id, update)
                  }
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="gap-2 bg-primary hover:bg-primary/90 text-white px-8"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "ส่งแบบประเมิน"
                )}
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                ถัดไป
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

// ============================================================
// QuestionInput Component — renders the right input for each type
// ============================================================
interface QuestionInputProps {
  question: AssessmentQuestionWithOptions;
  answer: AnswerState;
  onUpdate: (update: Partial<AnswerState>) => void;
}

const QuestionInput = ({ question, answer, onUpdate }: QuestionInputProps) => {
  switch (question.question_type) {
    case "short_text":
      return (
        <Input
          placeholder="พิมพ์คำตอบของคุณ..."
          value={answer.text_answer || ""}
          onChange={(e) => onUpdate({ text_answer: e.target.value })}
          className="text-base py-6"
        />
      );

    case "paragraph":
      return (
        <Textarea
          placeholder="พิมพ์คำตอบของคุณ..."
          value={answer.text_answer || ""}
          onChange={(e) => onUpdate({ text_answer: e.target.value })}
          className="min-h-[150px] text-base"
        />
      );

    case "multi_select":
      return (
        <div className="space-y-3">
          {question.assessment_options.map((option) => {
            const isChecked = (answer.selected_options || []).includes(option.id);
            return (
              <label
                key={option.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  isChecked
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const prev = answer.selected_options || [];
                    const updated = checked
                      ? [...prev, option.id]
                      : prev.filter((id) => id !== option.id);
                    onUpdate({ selected_options: updated });
                  }}
                />
                <span className="text-base">{option.option_text}</span>
              </label>
            );
          })}
        </div>
      );

    case "scale":
      return <ScaleInput question={question} answer={answer} onUpdate={onUpdate} />;

    default:
      return null;
  }
};

// ============================================================
// ScaleInput — 16personalities-style agree/disagree scale
// ============================================================
const ScaleInput = ({ question, answer, onUpdate }: QuestionInputProps) => {
  const min = question.scale_min;
  const max = question.scale_max;
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const scaleLabels: Record<number, string> = {
    1: "น้อยที่สุด",
    2: "น้อย",
    3: "ปานกลาง",
    4: "มาก",
    5: "มากที่สุด",
  };

  const scaleColors: Record<number, string> = {
    1: "bg-red-500 hover:bg-red-600 ring-red-300",
    2: "bg-orange-400 hover:bg-orange-500 ring-orange-200",
    3: "bg-yellow-400 hover:bg-yellow-500 ring-yellow-200",
    4: "bg-teal-400 hover:bg-teal-500 ring-teal-200",
    5: "bg-green-500 hover:bg-green-600 ring-green-300",
  };

  return (
    <div className="space-y-6">
      {/* Scale labels */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>{question.scale_min_label || "ไม่เห็นด้วยอย่างยิ่ง"}</span>
        <span>{question.scale_max_label || "เห็นด้วยอย่างยิ่ง"}</span>
      </div>

      {/* Scale buttons */}
      <div className="flex justify-center gap-2 sm:gap-3 md:gap-4">
        {steps.map((value) => {
          const isSelected = answer.scale_value === value;
          const colorClass = scaleColors[value] || "bg-gray-400";

          return (
            <motion.button
              key={value}
              type="button"
              onClick={() => onUpdate({ scale_value: value })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative flex flex-col items-center gap-1.5 transition-all duration-200
              `}
            >
              <div
                className={`
                  w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full
                  flex items-center justify-center
                  text-white font-bold text-lg sm:text-xl
                  transition-all duration-200 cursor-pointer
                  ${colorClass}
                  ${isSelected ? "ring-4 scale-110 shadow-lg" : "opacity-70 hover:opacity-100"}
                `}
              >
                {value}
              </div>
              <span
                className={`text-[10px] sm:text-xs transition-colors duration-200 ${
                  isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                {scaleLabels[value] || value}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selected indicator */}
      {answer.scale_value && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-primary font-medium"
        >
          คุณเลือก: {scaleLabels[answer.scale_value] || answer.scale_value} ({answer.scale_value} คะแนน)
        </motion.p>
      )}
    </div>
  );
};

export default AssessmentQuiz;
