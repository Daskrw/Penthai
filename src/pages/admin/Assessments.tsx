import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, Edit3, Loader2, BarChart2, Eye, Save,
  ChevronDown, ChevronUp, Users, Settings, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  RESULT_LEVELS, PCGA_SCALE_LABELS, DIMENSION_SHORT_TITLES,
  type AssessmentForm, type AssessmentFormFull, type AssessmentSectionWithQuestions,
  type AssessmentQuestionWithOptions, type AssessmentResponse, type AssessmentAnswer,
  type ResultLevel,
} from "@/types/assessment";

// ============================================================
// Admin Assessments — 3-Tab Layout
// ============================================================
export default function AdminAssessments() {
  const { toast } = useToast();
  const [form, setForm] = useState<AssessmentFormFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForm();
  }, []);

  const fetchForm = async () => {
    try {
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
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      // Sort
      const sorted = {
        ...data,
        assessment_sections: (data.assessment_sections || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((s: any) => ({
            ...s,
            assessment_questions: (s.assessment_questions || [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((q: any) => ({
                ...q,
                assessment_options: (q.assessment_options || []).sort(
                  (a: any, b: any) => a.sort_order - b.sort_order
                ),
              })),
          })),
      } as AssessmentFormFull;
      setForm(sorted);
    } catch (err) {
      console.error("Error:", err);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลแบบประเมินได้", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-16">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">ไม่พบแบบประเมิน</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">จัดการแบบประเมิน PCGA</h2>
        <p className="text-muted-foreground mt-1">แก้ไขคำถาม ดูผลประเมิน และตั้งค่าฟอร์ม</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" /> ตั้งค่าฟอร์ม
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <FileText className="h-4 w-4" /> แก้ไขคำถาม
          </TabsTrigger>
          <TabsTrigger value="responses" className="gap-2">
            <BarChart2 className="h-4 w-4" /> ดูผลประเมิน
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <FormSettingsTab form={form} onUpdate={fetchForm} />
        </TabsContent>
        <TabsContent value="questions">
          <QuestionsEditorTab form={form} onUpdate={fetchForm} />
        </TabsContent>
        <TabsContent value="responses">
          <ResponsesViewerTab formId={form.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Tab 1: Form Settings
// ============================================================
function FormSettingsTab({ form, onUpdate }: { form: AssessmentForm; onUpdate: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description || "");
  const [seedMax, setSeedMax] = useState(form.seed_max_percent);
  const [saplingMax, setSaplingMax] = useState(form.sapling_max_percent);
  const [isActive, setIsActive] = useState(form.is_active);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("assessment_forms")
        .update({
          title,
          description,
          seed_max_percent: seedMax,
          sapling_max_percent: saplingMax,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", form.id);
      if (error) throw error;
      toast({ title: "บันทึกสำเร็จ" });
      onUpdate();
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ตั้งค่าฟอร์มประเมิน</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">ชื่อแบบประเมิน</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">คำอธิบาย</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">คะแนนสูงสุดระดับเมล็ดพันธุ์ (Seed)</label>
            <Input type="number" value={seedMax} onChange={(e) => setSeedMax(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">0 ถึง {seedMax} = ชุมชนเมล็ดพันธุ์</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">คะแนนสูงสุดระดับต้นกล้า (Growth)</label>
            <Input type="number" value={saplingMax} onChange={(e) => setSaplingMax(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">{seedMax + 1} ถึง {saplingMax} = ชุมชนต้นกล้า</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{saplingMax + 1} ถึง 100 = ชุมชนไม้ใหญ่</p>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">สถานะ:</label>
          <Button
            variant={isActive ? "default" : "secondary"}
            size="sm"
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
          </Button>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Tab 2: Questions Editor
// ============================================================
function QuestionsEditorTab({ form, onUpdate }: { form: AssessmentFormFull; onUpdate: () => void }) {
  const { toast } = useToast();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const startEdit = (q: AssessmentQuestionWithOptions) => {
    setEditingQuestion(q.id);
    setEditText(q.question_text);
  };

  const saveQuestion = async (questionId: string) => {
    setSavingId(questionId);
    try {
      const { error } = await supabase
        .from("assessment_questions")
        .update({ question_text: editText })
        .eq("id", questionId);
      if (error) throw error;
      toast({ title: "บันทึกคำถามสำเร็จ" });
      setEditingQuestion(null);
      onUpdate();
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const saveWeight = async (sectionId: string, weight: number) => {
    try {
      const { error } = await supabase
        .from("assessment_sections")
        .update({ weight_percent: weight })
        .eq("id", sectionId);
      if (error) throw error;
      toast({ title: "บันทึกน้ำหนักคะแนนสำเร็จ" });
      onUpdate();
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      {form.assessment_sections.map((section) => (
        <Card key={section.id} className="overflow-hidden">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{section.title}</h3>
              {section.weight_percent > 0 && (
                <Badge variant="secondary">น้ำหนัก {section.weight_percent}%</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                ({section.assessment_questions.length} คำถาม)
              </span>
            </div>
            {expandedSection === section.id ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === section.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4 border-t">
                  {/* Weight editor for scored sections */}
                  {section.weight_percent > 0 && (
                    <div className="flex items-center gap-3 pt-4">
                      <label className="text-sm font-medium whitespace-nowrap">น้ำหนักคะแนน (%):</label>
                      <Input
                        type="number"
                        defaultValue={section.weight_percent}
                        className="w-24"
                        onBlur={(e) => saveWeight(section.id, Number(e.target.value))}
                      />
                    </div>
                  )}

                  {/* Questions list */}
                  {section.assessment_questions.map((q, idx) => (
                    <div key={q.id} className="p-3 rounded-lg border bg-background space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {q.question_number && (
                              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                {q.question_number}
                              </span>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                              {q.question_type}
                            </Badge>
                            {q.is_scored && (
                              <Badge className="text-[10px] bg-emerald-100 text-emerald-700">
                                มีคะแนน
                              </Badge>
                            )}
                          </div>

                          {editingQuestion === q.id ? (
                            <div className="flex gap-2">
                              <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => saveQuestion(q.id)}
                                  disabled={savingId === q.id}
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingQuestion(null)}
                                >
                                  ✕
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm">{q.question_text}</p>
                          )}
                        </div>

                        {editingQuestion !== q.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(q)}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Show options for multi_select / single_select */}
                      {(q.question_type === "multi_select" || q.question_type === "single_select") &&
                        q.assessment_options.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {q.assessment_options.map((opt) => (
                              <div key={opt.id} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                                {opt.option_text}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// Tab 3: Responses Viewer
// ============================================================
function ResponsesViewerTab({ formId }: { formId: string }) {
  const { toast } = useToast();
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
  }, [formId]);

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from("assessment_responses")
        .select(`
          *,
          profiles:user_id ( full_name, email )
        `)
        .eq("form_id", formId)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      setResponses(data || []);
    } catch (err) {
      console.error(err);
      // Fallback without profiles join
      try {
        const { data } = await supabase
          .from("assessment_responses")
          .select("*")
          .eq("form_id", formId)
          .order("completed_at", { ascending: false });
        setResponses(data || []);
      } catch {
        toast({ title: "ไม่สามารถโหลดข้อมูลได้", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const getLevelBadge = (level: string | null) => {
    const l = RESULT_LEVELS[(level as ResultLevel) || "seed"];
    return (
      <Badge
        style={{ backgroundColor: l.color + "20", color: l.color, borderColor: l.color + "40" }}
        variant="outline"
      >
        {l.icon} {l.thaiName}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ผลการประเมินทั้งหมด ({responses.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">ยังไม่มีผลการประเมิน</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ทำประเมิน</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead className="text-center">คะแนน</TableHead>
                  <TableHead>ระดับ</TableHead>
                  <TableHead className="text-right">ดูรายละเอียด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.profiles?.full_name || r.profiles?.email || r.user_id?.slice(0, 8) || "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(r.completed_at).toLocaleDateString("th-TH", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {Math.round(r.score_percent)}/100
                    </TableCell>
                    <TableCell>{getLevelBadge(r.result_level)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => setSelectedResponse(r.id)}
                      >
                        <Eye className="h-3.5 w-3.5" /> ดู
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedResponse && (
        <ResponseDetailDialog
          responseId={selectedResponse}
          formId={formId}
          onClose={() => setSelectedResponse(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// Response Detail Dialog
// ============================================================
function ResponseDetailDialog({
  responseId,
  formId,
  onClose,
}: {
  responseId: string;
  formId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<any>(null);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [form, setForm] = useState<AssessmentFormFull | null>(null);

  useEffect(() => {
    loadData();
  }, [responseId]);

  const loadData = async () => {
    try {
      const [respRes, ansRes, formRes] = await Promise.all([
        supabase.from("assessment_responses").select("*").eq("id", responseId).single(),
        supabase.from("assessment_answers").select("*").eq("response_id", responseId),
        supabase
          .from("assessment_forms")
          .select(`*, assessment_sections (*, assessment_questions (*, assessment_options (*)))`)
          .eq("id", formId)
          .single(),
      ]);

      setResponse(respRes.data);
      setAnswers(ansRes.data || []);

      if (formRes.data) {
        const sorted = {
          ...formRes.data,
          assessment_sections: (formRes.data.assessment_sections || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((s: any) => ({
              ...s,
              assessment_questions: (s.assessment_questions || [])
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((q: any) => ({
                  ...q,
                  assessment_options: (q.assessment_options || []).sort(
                    (a: any, b: any) => a.sort_order - b.sort_order
                  ),
                })),
            })),
        } as AssessmentFormFull;
        setForm(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAnswerForQuestion = (questionId: string) =>
    answers.find((a) => a.question_id === questionId);

  const levelData = response
    ? RESULT_LEVELS[(response.result_level as ResultLevel) || "seed"]
    : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>รายละเอียดผลการประเมิน</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : response && form ? (
          <div className="space-y-6">
            {/* Score Summary */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="text-4xl">{levelData?.icon}</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg" style={{ color: levelData?.color }}>
                  {levelData?.thaiName}
                </h3>
                <p className="text-sm text-muted-foreground">{levelData?.label}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{Math.round(response.score_percent)}</div>
                <div className="text-xs text-muted-foreground">/100 คะแนน</div>
              </div>
            </div>

            {/* Per-section answers */}
            {form.assessment_sections.map((section) => (
              <div key={section.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{section.title}</h4>
                  {section.weight_percent > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      น้ำหนัก {section.weight_percent}%
                    </Badge>
                  )}
                </div>

                {section.assessment_questions.map((q) => {
                  const ans = getAnswerForQuestion(q.id);
                  return (
                    <div key={q.id} className="pl-4 border-l-2 border-muted space-y-1">
                      <p className="text-sm font-medium">
                        {q.question_number && (
                          <span className="text-muted-foreground mr-1.5">{q.question_number}.</span>
                        )}
                        {q.question_text}
                      </p>
                      <div className="text-sm">
                        {q.question_type === "scale" && ans?.scale_value ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{
                                backgroundColor:
                                  ans.scale_value <= 2
                                    ? "#f59e0b"
                                    : ans.scale_value === 3
                                    ? "#eab308"
                                    : "#14b8a6",
                              }}
                            >
                              {ans.scale_value}
                            </div>
                            <span className="text-muted-foreground">
                              {PCGA_SCALE_LABELS[ans.scale_value] || ""}
                            </span>
                          </div>
                        ) : q.question_type === "multi_select" && ans?.selected_options ? (
                          <div className="flex flex-wrap gap-1">
                            {q.assessment_options
                              .filter((opt) => ans.selected_options?.includes(opt.id))
                              .map((opt) => (
                                <Badge key={opt.id} variant="secondary" className="text-xs">
                                  {opt.option_text}
                                </Badge>
                              ))}
                          </div>
                        ) : q.question_type === "single_select" && ans?.selected_options?.[0] ? (
                          <Badge variant="secondary" className="text-xs">
                            {q.assessment_options.find((o) => o.id === ans.selected_options?.[0])
                              ?.option_text || "—"}
                          </Badge>
                        ) : ans?.text_answer ? (
                          <p className="text-muted-foreground bg-muted/50 p-2 rounded text-xs">
                            {ans.text_answer}
                          </p>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs italic">ไม่ได้ตอบ</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">ไม่พบข้อมูล</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
