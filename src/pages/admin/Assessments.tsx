import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ClipboardCheck, Plus, Settings, Eye, Trash2, Edit3, Loader2, BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { AssessmentForm } from "@/types/assessment";

export default function AdminAssessments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [forms, setForms] = useState<AssessmentForm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from("assessment_forms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลแบบประเมินได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFormStatus = async (form: AssessmentForm) => {
    try {
      const { error } = await supabase
        .from("assessment_forms")
        .update({ is_active: !form.is_active })
        .eq("id", form.id);

      if (error) throw error;
      
      setForms(forms.map(f => 
        f.id === form.id ? { ...f, is_active: !f.is_active } : f
      ));
      
      toast({
        title: "อัปเดตสถานะสำเร็จ",
        description: `เปลี่ยนสถานะเป็น ${!form.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} แล้ว`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะได้",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">จัดการแบบประเมิน</h2>
          <p className="text-muted-foreground mt-2">
            สร้างและจัดการแบบประเมินชุมชน
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          สร้างแบบประเมินใหม่
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {forms.map((form) => (
          <motion.div
            key={form.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-primary">{form.title}</h3>
                    <Badge variant={form.is_active ? "default" : "secondary"}>
                      {form.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">
                    {form.description || "ไม่มีคำอธิบาย"}
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground pt-2">
                    <span>รหัส: {form.id.split("-")[0]}</span>
                    <span>เกณฑ์ต้นกล้า: &gt; {form.seed_max_percent}%</span>
                    <span>เกณฑ์ไม้ใหญ่: &gt; {form.sapling_max_percent}%</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <BarChart2 className="h-4 w-4" />
                    ดูผลประเมิน
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit3 className="h-4 w-4" />
                    แก้ไข
                  </Button>
                  <Button 
                    variant={form.is_active ? "destructive" : "default"} 
                    size="sm"
                    onClick={() => toggleFormStatus(form)}
                  >
                    {form.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {forms.length === 0 && (
          <Card className="p-12 text-center border-dashed border-2">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-1">ยังไม่มีแบบประเมิน</h3>
            <p className="text-muted-foreground">คลิกปุ่ม "สร้างแบบประเมินใหม่" เพื่อเริ่มต้น</p>
          </Card>
        )}
      </div>
    </div>
  );
}
