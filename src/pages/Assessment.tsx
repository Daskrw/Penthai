import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  LogIn,
  Leaf,
  Shield,
  TreePine,
  Sprout,
  Trees,
  Sparkles,
  Users,
  Lightbulb,
  TrendingUp,
  Award,
  Network,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroBg from "@/assets/image_4.png";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const TIERS = [
  {
    emoji: "🌱",
    label: "ชุมชนเมล็ดพันธุ์",
    labelEn: "Seed Community",
    range: "0-49 คะแนน",
    description:
      "ชุมชนที่มีทุนทางวัฒนธรรมและศักยภาพพื้นฐาน แต่ยังไม่ได้รับการพัฒนาอย่างเป็นระบบ",
    border: "border-amber-900/20",
    badge: "bg-amber-900/10 text-amber-900",
    icon: Sprout,
    iconColor: "text-amber-900",
  },
  {
    emoji: "🌿",
    label: "ชุมชนต้นกล้า",
    labelEn: "Growth Community",
    range: "50-74 คะแนน",
    description:
      "ชุมชนที่เริ่มนำทุนทางวัฒนธรรมมาต่อยอดผ่านกระบวนการสร้างสรรค์",
    border: "border-amber-900/20",
    badge: "bg-amber-900/10 text-amber-900",
    icon: TreePine,
    iconColor: "text-amber-900",
  },
  {
    emoji: "🌳",
    label: "ชุมชนไม้ใหญ่",
    labelEn: "Legacy Community",
    range: "75-100 คะแนน",
    description:
      "ชุมชนที่สามารถสร้างรายได้จากทุนทางวัฒนธรรมได้อย่างต่อเนื่อง",
    border: "border-amber-900/20",
    badge: "bg-amber-900/10 text-amber-900",
    icon: Trees,
    iconColor: "text-amber-900",
  },
] as const;

const DIMENSIONS = [
  { label: "ทุนทางวัฒนธรรม", weight: 20, icon: Sparkles },
  { label: "ความเข้มแข็งของชุมชน", weight: 15, icon: Users },
  { label: "ความคิดสร้างสรรค์และนวัตกรรม", weight: 20, icon: Lightbulb },
  { label: "ความพร้อมทางธุรกิจและตลาด", weight: 15, icon: TrendingUp },
  { label: "มาตรฐานสินค้าและบริการ", weight: 15, icon: Award },
  { label: "ความยั่งยืนและเครือข่าย", weight: 15, icon: Network },
] as const;

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Assessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isAcceptEnabled, setIsAcceptEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ---------- countdown logic ---------- */

  useEffect(() => {
    if (!showPrivacyModal) return;

    setCountdown(3);
    setIsAcceptEnabled(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsAcceptEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showPrivacyModal]);

  /* ---------- handlers ---------- */

  const handleStart = useCallback(() => {
    setShowPrivacyModal(true);
  }, []);

  const handleAccept = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("assessment_forms")
        .select("id")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        toast({
          title: "ไม่พบแบบประเมิน",
          description: "ขณะนี้ยังไม่มีแบบประเมินที่เปิดใช้งาน กรุณาลองใหม่ภายหลัง",
          variant: "destructive",
        });
        setShowPrivacyModal(false);
        return;
      }

      navigate(`/assessment/quiz?formId=${data.id}`);
    } catch {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดแบบประเมินได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  const handleDecline = useCallback(() => {
    setShowPrivacyModal(false);
    navigate("/");
  }, [navigate]);

  /* ---------------------------------------------------------------- */
  /*  Auth Gate                                                        */
  /* ---------------------------------------------------------------- */

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 font-sans">
        <Navbar />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full bg-white border-stone-200 p-8 text-center space-y-6 shadow-sm rounded-none">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">
              กรุณาเข้าสู่ระบบ
            </h2>
            <p className="text-stone-600 leading-relaxed font-light">
              คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถเริ่มทำแบบประเมิน PCGA ได้
            </p>
            <Button
              asChild
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium rounded-none"
            >
              <Link to="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                เข้าสู่ระบบ
              </Link>
            </Button>
          </Card>
        </motion.div>
        <Footer />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Main Page                                                        */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-red-100 selection:text-red-900">
      <Navbar />

      {/* ============================================================ */}
      {/*  HERO                                                         */}
      {/* ============================================================ */}
      <section 
        className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-stone-50/85 backdrop-blur-[2px]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-1.5 text-sm font-medium text-stone-600 border border-stone-200">
                <Leaf className="h-4 w-4 text-red-600" />
                Community Assessment Tool
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-stone-900 uppercase"
            >
              PCGA
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-4 text-lg sm:text-xl font-medium text-red-600 tracking-wide"
            >
              Penthai Community Growth Assessment
            </motion.p>

            <motion.p
              variants={fadeUp}
              custom={3}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-600 font-light"
            >
              เครื่องมือประเมินศักยภาพและความพร้อมของชุมชนเพื่อการพัฒนาอย่างยั่งยืน
            </motion.p>

            <motion.div variants={fadeUp} custom={4} className="mt-12">
              <Button
                onClick={handleStart}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-10 py-7 text-lg font-medium rounded-none transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(68,28,19,0.2)]"
              >
                เริ่มทำแบบประเมิน
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  THREE-TIER GROWTH VISUALIZATION                              */}
      {/* ============================================================ */}
      <section className="relative bg-white py-20 lg:py-32 border-y border-stone-200">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl sm:text-4xl font-bold text-stone-900"
            >
              ระดับการเติบโตของชุมชน
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-4 text-stone-600 max-w-xl mx-auto font-light"
            >
              ผลการประเมินจะจัดชุมชนของคุณเข้าสู่หนึ่งในสามระดับการเติบโต
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid gap-8 md:grid-cols-3"
          >
            {TIERS.map((tier, i) => {
              const Icon = tier.icon;
              return (
                <motion.div key={tier.label} variants={fadeUp} custom={i}>
                  <Card
                    className={`group relative h-full bg-stone-50 rounded-none border ${tier.border} p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
                  >
                    {/* Icon */}
                    <div className="mb-6 flex items-center">
                      <span className="text-4xl">{tier.emoji}</span>
                    </div>

                    {/* Title & Range */}
                    <h3 className="text-xl font-bold text-stone-900">
                      {tier.label}
                    </h3>
                    <p className="text-sm font-medium text-stone-500 mt-1">
                      {tier.labelEn}
                    </p>
                    <span
                      className={`mt-4 inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tier.badge}`}
                    >
                      {tier.range}
                    </span>

                    {/* Description */}
                    <p className="mt-6 text-sm leading-relaxed text-stone-600 font-light">
                      {tier.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SIX-DIMENSION PREVIEW GRID                                   */}
      {/* ============================================================ */}
      <section className="relative bg-stone-50 py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl sm:text-4xl font-bold text-stone-900"
            >
              6 มิติการประเมิน
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-4 text-stone-600 max-w-xl mx-auto font-light"
            >
              แบบประเมินครอบคลุม 6 มิติสำคัญที่สะท้อนศักยภาพรอบด้านของชุมชน
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {DIMENSIONS.map((dim, i) => {
              const Icon = dim.icon;
              return (
                <motion.div key={dim.label} variants={fadeUp} custom={i}>
                  <Card className="group relative h-full bg-white rounded-none border border-stone-200 p-6 transition-all duration-300 hover:border-red-600 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-stone-100 rounded-none group-hover:bg-red-50 transition-colors">
                          <Icon className="h-5 w-5 text-stone-700 group-hover:text-red-600 transition-colors" />
                        </div>
                        <h3 className="text-base font-bold text-stone-900 leading-snug">
                          {dim.label}
                        </h3>
                      </div>
                      <span className="shrink-0 bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                        {dim.weight}%
                      </span>
                    </div>
                    {/* Subtle progress indicator */}
                    <div className="mt-6 h-1 w-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-red-600 transition-all duration-700"
                        style={{ width: `${dim.weight * 4}%` }}
                      />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  BOTTOM CTA                                                   */}
      {/* ============================================================ */}
      <section className="relative bg-white py-24 lg:py-32 border-t border-stone-200">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="relative mx-auto max-w-3xl px-4 text-center"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mx-auto mb-8 flex h-16 w-16 items-center justify-center bg-red-50"
          >
            <Leaf className="h-8 w-8 text-red-600" />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 whitespace-nowrap tracking-tight"
          >
            พร้อมที่จะค้นพบศักยภาพชุมชนของคุณแล้วหรือยัง?
          </motion.h2>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg text-stone-600 leading-relaxed font-light"
          >
            เริ่มทำแบบประเมิน PCGA วันนี้
            เพื่อรับผลวิเคราะห์และแนวทางการพัฒนาชุมชนที่เหมาะสม
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-10">
            <Button
              onClick={handleStart}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-10 py-7 text-lg font-medium rounded-none transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(68,28,19,0.2)]"
            >
              เริ่มทำแบบประเมินเลย
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <Footer />

      {/* ============================================================ */}
      {/*  PRIVACY CONSENT MODAL                                        */}
      {/* ============================================================ */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="sm:max-w-lg bg-white border border-stone-200 rounded-none shadow-xl">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-red-50 rounded-none">
              <Shield className="h-7 w-7 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-stone-900">
              ข้อตกลงและความเป็นส่วนตัว
            </DialogTitle>
            <DialogDescription className="mt-4 text-sm leading-relaxed text-stone-600 text-center font-light">
              แบบสอบถามนี้จัดทำขึ้นเพื่อประเมินศักยภาพและความพร้อมของชุมชน
              ข้อมูลที่ท่านให้จะถูกเก็บรักษาเป็นความลับและนำไปใช้เพื่อการวิเคราะห์และออกแบบแนวทางการพัฒนาที่เหมาะสมกับชุมชนของท่านเท่านั้น
              ข้อมูลจะไม่ถูกเปิดเผยต่อบุคคลภายนอกโดยไม่ได้รับความยินยอม
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 rounded-none"
            >
              ปฏิเสธ
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!isAcceptEnabled || isLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "กำลังโหลด..."
                : countdown > 0
                  ? `ยอมรับ (${countdown})`
                  : "ยอมรับ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assessment;
