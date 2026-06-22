import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, Home, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  RESULT_LEVELS,
  DIMENSION_SHORT_TITLES,
  type ResultLevel,
  type DimensionScore,
} from '@/types/assessment';

// ─── Radar Chart Component ───────────────────────────────────────────────────

interface RadarChartProps {
  dimensions: DimensionScore[];
  color: string;
}

const RadarChart = ({ dimensions, color }: RadarChartProps) => {
  const size = 300;
  const center = size / 2;
  const maxRadius = size / 2 - 40;
  const angleStep = (2 * Math.PI) / dimensions.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const gridLevels = [20, 40, 60, 80, 100];

  // Build data polygon
  const dataPoints = dimensions.map((d, i) => {
    const normalizedPercent = d.maxRawScore > 0 ? (d.rawScore / d.maxRawScore) * 100 : 0;
    return getPoint(i, normalizedPercent);
  });
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + 'Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px] mx-auto">
      {/* Grid levels */}
      {gridLevels.map((level) => {
        const pts = dimensions.map((_, i) => getPoint(i, level));
        const path =
          pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + 'Z';
        return (
          <path
            key={`grid-${level}`}
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-border"
            opacity={0.5}
          />
        );
      })}

      {/* Axis lines */}
      {dimensions.map((_, i) => {
        const end = getPoint(i, 100);
        return (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={end.x}
            y2={end.y}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-border"
            opacity={0.5}
          />
        );
      })}

      {/* Data polygon */}
      <motion.path
        d={dataPath}
        fill={color}
        fillOpacity={0.3}
        stroke={color}
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
        style={{ transformOrigin: `${center}px ${center}px` }}
      />

      {/* Data points (dots) */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={`dot-${i}`}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={color}
          stroke="white"
          strokeWidth={2}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 1 + i * 0.1 }}
        />
      ))}

      {/* Axis labels */}
      {dimensions.map((d, i) => {
        const labelPoint = getPoint(i, 120);
        return (
          <text
            key={`label-${i}`}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground text-[10px] font-medium"
          >
            {d.shortTitle}
          </text>
        );
      })}
    </svg>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const AssessmentResult = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const responseId = searchParams.get('responseId');

  const [response, setResponse] = useState<
    | (Record<string, any> & {
        assessment_forms: { title: string };
      })
    | null
  >(null);
  const [dimensions, setDimensions] = useState<DimensionScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!responseId) {
      setError('ไม่พบรหัสผลการประเมิน');
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        // 1) Fetch the response with joined form title
        const { data: responseData, error: responseError } = await supabase
          .from('assessment_responses')
          .select(`*, assessment_forms ( title )`)
          .eq('id', responseId)
          .single();

        if (responseError) throw responseError;
        if (!responseData) throw new Error('ไม่พบข้อมูล');

        setResponse(responseData as any);

        const formId = responseData.form_id;

        // 2) Fetch the full form structure (sections with questions)
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('assessment_sections')
          .select(`*, assessment_questions ( id, is_scored )`)
          .eq('form_id', formId)
          .order('sort_order', { ascending: true });

        if (sectionsError) throw sectionsError;

        // 3) Fetch all answers for this response
        const { data: answersData, error: answersError } = await supabase
          .from('assessment_answers')
          .select('*')
          .eq('response_id', responseId);

        if (answersError) throw answersError;

        // Build a map: question_id → scale_value
        const answerMap = new Map<string, number>();
        for (const a of answersData || []) {
          if (a.scale_value != null) {
            answerMap.set(a.question_id, a.scale_value);
          }
        }

        // 4) Calculate DimensionScore[] for each scored section
        const dims: DimensionScore[] = [];

        for (const section of sectionsData || []) {
          if (section.weight_percent <= 0) continue;

          const scoredQuestions = (section.assessment_questions || []).filter(
            (q: any) => q.is_scored,
          );
          const numScored = scoredQuestions.length;
          if (numScored === 0) continue;

          let rawScore = 0;
          for (const q of scoredQuestions) {
            rawScore += answerMap.get(q.id) || 0;
          }
          const maxRawScore = numScored * 5;
          const weightedScore =
            maxRawScore > 0 ? (rawScore / maxRawScore) * section.weight_percent : 0;

          // Look up the short title from the mapping, fall back to a trimmed version
          const shortTitle =
            DIMENSION_SHORT_TITLES[section.title] ||
            section.title.replace(/^มิติที่\s*\d+\s*:\s*/, '').slice(0, 12);

          dims.push({
            sectionId: section.id,
            title: section.title,
            shortTitle,
            weight: section.weight_percent,
            rawScore,
            maxRawScore,
            weightedScore: Math.round(weightedScore * 100) / 100,
          });
        }

        setDimensions(dims);
      } catch (err: any) {
        console.error('Error fetching result:', err);
        setError('ไม่สามารถโหลดผลการประเมินได้');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [responseId]);

  // ─── Loading State ───────────────────────────────────────────────────────

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

  // ─── Not Authenticated ───────────────────────────────────────────────────

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex items-center justify-center bg-background px-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">กรุณาเข้าสู่ระบบ</h2>
            <p className="text-muted-foreground">คุณต้องเข้าสู่ระบบเพื่อดูผลการประเมิน</p>
            <Button onClick={() => navigate('/auth')}>เข้าสู่ระบบ</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────

  if (error || !response) {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex items-center justify-center bg-background px-4">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/assessment')} className="mt-4">
              กลับไปหน้าประเมิน
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ─── Derived Values ──────────────────────────────────────────────────────

  const levelKey: ResultLevel = response.result_level || 'seed';
  const levelData = RESULT_LEVELS[levelKey];
  const percent = response.score_percent ?? 0;
  const totalScore = response.total_score ?? 0;

  // SVG circle animation constants
  const circleRadius = 80;
  const circumference = 2 * Math.PI * circleRadius;
  const targetDash = (percent / 100) * circumference;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pb-20">
        {/* ──────── 1. Gradient Header ──────── */}
        <div className={`pt-20 pb-32 px-4 bg-gradient-to-b ${levelData.bgGradient} text-white`}>
          <div className="container mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-md">
                ผลการประเมิน PCGA
              </h1>
              <p className="text-white/90 text-lg md:text-xl font-medium drop-shadow-sm">
                {response.assessment_forms?.title}
              </p>
            </motion.div>
          </div>
        </div>

        {/* ──────── 2. Score Card ──────── */}
        <div className="container mx-auto max-w-3xl px-4 -mt-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="rounded-3xl shadow-2xl border border-border">
              <CardContent className="p-8 md:p-12 text-center">
                {/* Animated Score Circle */}
                <div className="flex justify-center mb-8">
                  <div className="relative w-48 h-48 md:w-56 md:h-56">
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full transform -rotate-90"
                    >
                      {/* Background track */}
                      <circle
                        cx="100"
                        cy="100"
                        r={circleRadius}
                        className="stroke-muted fill-transparent"
                        strokeWidth={10}
                      />
                      {/* Animated score arc */}
                      <motion.circle
                        cx="100"
                        cy="100"
                        r={circleRadius}
                        className="fill-transparent"
                        stroke={levelData.color}
                        strokeWidth={10}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${targetDash} ${circumference}` }}
                        transition={{ duration: 2, ease: 'easeOut', delay: 0.5 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        className="text-5xl md:text-6xl font-bold"
                        style={{ color: levelData.color }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.6 }}
                      >
                        {Math.round(percent)}
                      </motion.span>
                      <span className="text-sm text-muted-foreground mt-1">/100 คะแนน</span>
                    </div>
                  </div>
                </div>

                {/* Level Emoji + Name */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 text-5xl">
                    {levelData.icon}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-wider uppercase text-muted-foreground mb-1">
                      ระดับชุมชนของคุณ
                    </h2>
                    <h3
                      className="text-3xl md:text-4xl font-extrabold mb-1"
                      style={{ color: levelData.color }}
                    >
                      {levelData.thaiName}
                    </h3>
                    <p className="text-base text-muted-foreground font-medium">
                      {levelData.label}
                    </p>
                    <span
                      className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: levelData.color }}
                    >
                      {levelData.scoreRange}
                    </span>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto pt-2">
                    {levelData.description}
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ──────── 3. Radar Chart ──────── */}
        {dimensions.length > 0 && (
          <div className="container mx-auto max-w-3xl px-4 mt-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Card className="rounded-2xl shadow-lg border border-border">
                <CardContent className="p-6 md:p-10">
                  <h2 className="text-xl md:text-2xl font-bold text-center mb-6">
                    แผนภูมิมิติการประเมิน
                  </h2>
                  <RadarChart dimensions={dimensions} color={levelData.color} />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* ──────── 4. Dimension Breakdown ──────── */}
        {dimensions.length > 0 && (
          <div className="container mx-auto max-w-3xl px-4 mt-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Card className="rounded-2xl shadow-lg border border-border">
                <CardContent className="p-6 md:p-10">
                  <h2 className="text-xl md:text-2xl font-bold mb-6">
                    รายละเอียดคะแนนรายมิติ
                  </h2>
                  <div className="space-y-5">
                    {dimensions.map((dim, i) => {
                      const pct =
                        dim.maxRawScore > 0
                          ? Math.round((dim.rawScore / dim.maxRawScore) * 100)
                          : 0;
                      return (
                        <motion.div
                          key={dim.sectionId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + i * 0.12, duration: 0.4 }}
                        >
                          {/* Title row */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm md:text-base font-semibold text-foreground truncate">
                                {dim.title}
                              </span>
                              <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                น้ำหนัก {dim.weight}%
                              </span>
                            </div>
                            <span
                              className="text-sm font-bold shrink-0 ml-2"
                              style={{ color: levelData.color }}
                            >
                              {dim.weightedScore.toFixed(1)} คะแนน
                            </span>
                          </div>

                          {/* Bar */}
                          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{ backgroundColor: levelData.color }}
                              initial={{ width: '0%' }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, delay: 1.2 + i * 0.12, ease: 'easeOut' }}
                            />
                          </div>

                          {/* Sub-label */}
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>
                              {dim.rawScore} / {dim.maxRawScore} คะแนนดิบ
                            </span>
                            <span>{pct}%</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Weighted total summary */}
                  <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">
                        คะแนนถ่วงน้ำหนักรวม
                      </span>
                      <span
                        className="text-2xl font-extrabold"
                        style={{ color: levelData.color }}
                      >
                        {Math.round(percent)} / 100
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* ──────── 5. Action Buttons ──────── */}
        <div className="container mx-auto max-w-3xl px-4 mt-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
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
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AssessmentResult;
