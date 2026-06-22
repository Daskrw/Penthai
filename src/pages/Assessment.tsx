import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardCheck, Calculator, Trophy, ArrowRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from '@/hooks/use-toast';

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.55, ease: 'easeOut' },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
  }),
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */
const steps = [
  {
    icon: ClipboardCheck,
    title: 'ตอบแบบสอบถาม',
    description: 'ตอบคำถามเกี่ยวกับทรัพยากรและศักยภาพของชุมชนคุณ',
  },
  {
    icon: Calculator,
    title: 'ระบบคำนวณคะแนน',
    description: 'ระบบจะวิเคราะห์และคำนวณคะแนนความพร้อมอัตโนมัติ',
  },
  {
    icon: Trophy,
    title: 'รับผลประเมิน',
    description: 'ดูผลลัพธ์พร้อมคำแนะนำในการพัฒนาชุมชนของคุณ',
  },
];

const levels = [
  {
    emoji: '🌱',
    title: 'ชุมชนเมล็ดพันธุ์',
    subtitle: 'Seed Community',
    description: 'ชุมชนที่เริ่มต้นสำรวจศักยภาพ พร้อมเรียนรู้และพัฒนาต่อยอด',
    gradient: 'from-emerald-500/80 to-green-600/80',
    border: 'border-emerald-400/40',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-300/50',
  },
  {
    emoji: '🌿',
    title: 'ชุมชนต้นกล้า',
    subtitle: 'Sapling Community',
    description: 'ชุมชนที่มีรากฐานมั่นคง พร้อมขยายผลและเชื่อมต่อเครือข่าย',
    gradient: 'from-teal-500/80 to-cyan-600/80',
    border: 'border-teal-400/40',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    ring: 'ring-teal-300/50',
  },
  {
    emoji: '🌳',
    title: 'ชุมชนไม้ใหญ่',
    subtitle: 'Big Tree Community',
    description: 'ชุมชนที่แข็งแกร่ง พร้อมเป็นต้นแบบและแบ่งปันองค์ความรู้',
    gradient: 'from-green-700/80 to-emerald-800/80',
    border: 'border-green-500/40',
    bg: 'bg-green-50',
    text: 'text-green-800',
    ring: 'ring-green-400/50',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const Assessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /* ---------- Auth gate ---------- */
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full text-center space-y-6"
          >
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800">
              กรุณาเข้าสู่ระบบ
            </h2>
            <p className="text-gray-500">
              คุณจำเป็นต้องเข้าสู่ระบบเพื่อเข้าถึงแบบประเมินความพร้อมชุมชน
            </p>

            <Link to="/auth">
              <Button size="lg" className="gap-2 mt-2">
                <LogIn className="w-5 h-5" />
                เข้าสู่ระบบ
              </Button>
            </Link>
          </motion.div>
        </div>

        <Footer />
      </div>
    );
  }

  /* ---------- Start assessment handler ---------- */
  const handleStart = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assessment_forms')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error || !data) {
        toast({
          title: 'ไม่พบแบบประเมิน',
          description: 'ขณะนี้ยังไม่มีแบบประเมินที่เปิดใช้งาน กรุณาลองอีกครั้งภายหลัง',
          variant: 'destructive',
        });
        return;
      }

      navigate(`/assessment/quiz?formId=${data.id}`);
    } catch {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดแบบประเมินได้ กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden isolate">
        {/* Gradient background */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-red-700 via-red-600 to-amber-500"
        />
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-red-900/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl px-4 py-24 sm:py-32 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-md"
          >
            แบบประเมินความพร้อมชุมชน
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed"
          >
            ประเมินศักยภาพและความพร้อมในการพัฒนาซอฟต์พาวเวอร์ของชุมชนคุณ
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-8"
          >
            <Button
              size="lg"
              onClick={handleStart}
              disabled={loading}
              className="bg-white text-red-700 hover:bg-amber-50 shadow-lg shadow-red-900/30 text-base px-8 py-6 rounded-xl gap-2 font-semibold transition-transform hover:scale-105"
            >
              {loading ? 'กำลังโหลด...' : 'เริ่มทำแบบประเมิน'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-20 px-4 bg-gradient-to-b from-red-50/60 to-white">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            className="text-2xl sm:text-3xl font-bold text-center text-gray-800"
          >
            ขั้นตอนการประเมิน
          </motion.h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  custom={i + 1}
                  className="flex flex-col items-center text-center"
                >
                  {/* Step number ring */}
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-200">
                      <Icon className="w-9 h-9 text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-white text-sm font-bold flex items-center justify-center shadow">
                      {i + 1}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-xs">
                    {step.description}
                  </p>

                  {/* Connector line (hidden on last item & mobile) */}
                  {i < steps.length - 1 && (
                    <div className="hidden sm:block absolute" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== RESULT LEVELS ==================== */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            className="text-2xl sm:text-3xl font-bold text-center text-gray-800"
          >
            ระดับผลประเมิน
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={1}
            className="mt-3 text-center text-gray-500 max-w-lg mx-auto"
          >
            ชุมชนของคุณจะได้รับการจัดระดับเป็นหนึ่งในสามระดับต่อไปนี้
          </motion.p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {levels.map((level, i) => (
              <motion.div
                key={level.title}
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                custom={i + 1}
              >
                <Card
                  className={`group relative overflow-hidden border ${level.border} hover:shadow-xl transition-shadow duration-300 rounded-2xl`}
                >
                  {/* Coloured header strip */}
                  <div
                    className={`h-2 w-full bg-gradient-to-r ${level.gradient}`}
                  />

                  <CardContent className="pt-7 pb-6 px-5 flex flex-col items-center text-center">
                    <span className="text-5xl drop-shadow">{level.emoji}</span>

                    <h3 className={`mt-4 text-lg font-bold ${level.text}`}>
                      {level.title}
                    </h3>
                    <span className="text-xs text-gray-400 tracking-wide uppercase">
                      {level.subtitle}
                    </span>

                    <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                      {level.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== BOTTOM CTA ==================== */}
      <section className="relative overflow-hidden py-20 px-4">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-red-700 via-red-600 to-amber-500"
        />
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[50rem] h-[50rem] rounded-full bg-amber-400/10 blur-3xl"
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          custom={0}
          className="relative max-w-xl mx-auto text-center space-y-6"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            พร้อมที่จะเริ่มประเมินชุมชนของคุณแล้วหรือยัง?
          </h2>
          <p className="text-white/80 text-base sm:text-lg">
            ใช้เวลาเพียงไม่กี่นาที เพื่อค้นพบศักยภาพที่แท้จริงของชุมชน
          </p>

          <Button
            size="lg"
            onClick={handleStart}
            disabled={loading}
            className="bg-white text-red-700 hover:bg-amber-50 shadow-lg shadow-red-900/30 text-base px-8 py-6 rounded-xl gap-2 font-semibold transition-transform hover:scale-105"
          >
            {loading ? 'กำลังโหลด...' : 'เริ่มทำแบบประเมิน'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </Button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Assessment;
