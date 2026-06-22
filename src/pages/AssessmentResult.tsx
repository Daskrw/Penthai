import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, Home, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RESULT_LEVELS, ResultLevel, AssessmentResponse } from "@/types/assessment";

const AssessmentResult = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const responseId = searchParams.get("responseId");

  const [response, setResponse] = useState<(AssessmentResponse & { assessment_forms: { title: string } }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!responseId) {
      setError("ไม่พบรหัสผลการประเมิน");
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const { data, error } = await supabase
          .from("assessment_responses")
          .select(`
            *,
            assessment_forms ( title )
          `)
          .eq("id", responseId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("ไม่พบข้อมูล");

        setResponse(data as any);
      } catch (err: any) {
        console.error("Error fetching result:", err);
        setError("ไม่สามารถโหลดผลการประเมินได้");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [responseId]);

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex flex-col items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground text-lg">กำลังประมวลผล...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex items-center justify-center bg-background px-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">กรุณาเข้าสู่ระบบ</h2>
            <p className="text-muted-foreground">คุณต้องเข้าสู่ระบบเพื่อดูผลการประเมิน</p>
            <Button onClick={() => navigate("/auth")}>เข้าสู่ระบบ</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !response) {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex items-center justify-center bg-background px-4">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate("/assessment")} className="mt-4">
              กลับไปหน้าประเมิน
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const levelKey = response.result_level || "seed";
  const levelData = RESULT_LEVELS[levelKey];
  const percent = response.score_percent;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pb-20">
        {/* Dynamic Gradient Header based on result level */}
        <div className={`pt-20 pb-32 px-4 bg-gradient-to-b ${levelData.bgGradient} text-white`}>
          <div className="container mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-md">
                ผลการประเมิน
              </h1>
              <p className="text-white/90 text-lg md:text-xl font-medium drop-shadow-sm">
                {response.assessment_forms?.title}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Result Card Container */}
        <div className="container mx-auto max-w-3xl px-4 -mt-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-card rounded-3xl shadow-2xl border border-border p-8 md:p-12 text-center"
          >
            {/* Animated Score Circle */}
            <div className="flex justify-center mb-8">
              <div className="relative w-40 h-40 md:w-48 md:h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    className="stroke-muted fill-transparent stroke-[8]"
                  />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    className="fill-transparent stroke-[8] stroke-current"
                    style={{ color: levelData.color }}
                    initial={{ strokeDasharray: "0 1000" }}
                    animate={{ strokeDasharray: `${(percent / 100) * 283} 1000` }}
                    transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl md:text-5xl font-bold" style={{ color: levelData.color }}>
                    {percent}%
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {response.total_score} / {response.max_possible_score} คะแนน
                  </span>
                </div>
              </div>
            </div>

            {/* Result Level Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 text-5xl mb-2">
                {levelData.icon}
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-wider uppercase text-muted-foreground mb-2">
                  ระดับชุมชนของคุณ
                </h2>
                <h3 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: levelData.color }}>
                  {levelData.thaiName}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
                  {levelData.description}
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-border"
            >
              <Link to="/assessment" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full gap-2 text-base">
                  <RefreshCw className="h-4 w-4" />
                  ทำแบบประเมินอีกครั้ง
                </Button>
              </Link>
              <Link to="/" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 text-base bg-primary hover:bg-primary/90">
                  <Home className="h-4 w-4" />
                  กลับหน้าหลัก
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AssessmentResult;
