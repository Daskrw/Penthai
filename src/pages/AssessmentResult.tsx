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

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  bg: '#FAFAFA',
  cardBg: '#FFFFFF',
  text: '#171717',
  textMuted: '#525252',
  red: '#B91C1C',
  brown: '#5C4033',
  brownLight: 'rgba(92, 64, 51, 0.15)',
  redLight: 'rgba(185, 28, 28, 0.1)',
};

// ─── Radar Chart Component ───────────────────────────────────────────────────

interface RadarChartProps {
  dimensions: DimensionScore[];
  fillColor: string;
  strokeColor: string;
}

const RadarChart = ({ dimensions, fillColor, strokeColor }: RadarChartProps) => {
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
            stroke={strokeColor}
            strokeWidth={0.5}
            opacity={0.3}
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
            stroke={strokeColor}
            strokeWidth={0.5}
            opacity={0.3}
          />
        );
      })}

      {/* Data polygon */}
      <motion.path
        d={dataPath}
        fill={fillColor}
        fillOpacity={0.3}
        stroke={strokeColor}
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
          fill={fillColor}
          stroke={strokeColor}
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
            style={{ fill: THEME.text }}
            className="text-[10px] font-medium"
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
        <main
          className="min-h-[80vh] flex flex-col items-center justify-center"
          style={{ backgroundColor: THEME.bg }}
        >
          <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: THEME.red }} />
          <p className="text-lg" style={{ color: THEME.textMuted }}>กำลังประมวลผล...</p>
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
        <main
          className="min-h-[80vh] flex items-center justify-center px-4"
          style={{ backgroundColor: THEME.bg }}
        >
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: THEME.text }}>กรุณาเข้าสู่ระบบ</h2>
            <p style={{ color: THEME.textMuted }}>คุณต้องเข้าสู่ระบบเพื่อดูผลการประเมิน</p>
            <Button
              onClick={() => navigate('/auth')}
              style={{ backgroundColor: THEME.red, color: 'white' }}
              className="hover:opacity-90"
            >
              เข้าสู่ระบบ
            </Button>
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
        <main
          className="min-h-[80vh] flex items-center justify-center px-4"
          style={{ backgroundColor: THEME.bg }}
        >
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="h-16 w-16 mx-auto" style={{ color: THEME.red }} />
            <h2 className="text-2xl font-bold" style={{ color: THEME.text }}>เกิดข้อผิดพลาด</h2>
            <p style={{ color: THEME.textMuted }}>{error}</p>
            <Button
              onClick={() => navigate('/assessment')}
              className="mt-4 hover:opacity-90"
              style={{ backgroundColor: THEME.red, color: 'white' }}
            >
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
  // totalScore is unused directly in display here but fetched:
  // const totalScore = response.total_score ?? 0;

  // SVG circle animation constants
  const circleRadius = 80;
  const circumference = 2 * Math.PI * circleRadius;
  const targetDash = (percent / 100) * circumference;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-20" style={{ backgroundColor: THEME.bg }}>
        {/* ──────── 1. Header ──────── */}
        <div
          className="pt-20 pb-32 px-4 border-b border-opacity-20"
          style={{ backgroundColor: THEME.cardBg, borderColor: THEME.brown }}
        >
          <div className="container mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1
                className="text-3xl md:text-5xl font-bold mb-4 tracking-tight"
                style={{ color: THEME.text }}
              >
                ผลการประเมิน PCGA
              </h1>
              <p className="text-lg md:text-xl font-medium" style={{ color: THEME.textMuted }}>
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
            <Card
              className="rounded-3xl shadow-xl border"
              style={{ backgroundColor: THEME.cardBg, borderColor: THEME.brownLight }}
            >
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
                        fill="transparent"
                        stroke={THEME.brownLight}
                        strokeWidth={10}
                      />
                      {/* Animated score arc */}
                      <motion.circle
                        cx="100"
                        cy="100"
                        r={circleRadius}
                        fill="transparent"
                        stroke={THEME.red}
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
                        style={{ color: THEME.text }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.6 }}
                      >
                        {Math.round(percent)}
                      </motion.span>
                      <span className="text-sm mt-1" style={{ color: THEME.textMuted }}>
                        /100 คะแนน
                      </span>
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
                  <div
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full text-5xl"
                    style={{ backgroundColor: THEME.bg }}
                  >
                    {levelData.icon}
                  </div>
                  <div>
                    <h2
                      className="text-sm font-bold tracking-wider uppercase mb-1"
                      style={{ color: THEME.textMuted }}
                    >
                      ระดับชุมชนของคุณ
                    </h2>
                    <h3
                      className="text-3xl md:text-4xl font-extrabold mb-1"
                      style={{ color: THEME.red }}
                    >
                      {levelData.thaiName}
                    </h3>
                    <p className="text-base font-medium" style={{ color: THEME.textMuted }}>
                      {levelData.label}
                    </p>
                    <span
                      className="inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-sm"
                      style={{ backgroundColor: THEME.brown }}
                    >
                      {levelData.scoreRange}
                    </span>
                  </div>
                  <p
                    className="text-base leading-relaxed max-w-xl mx-auto pt-4"
                    style={{ color: THEME.textMuted }}
                  >
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
              <Card
                className="rounded-2xl shadow-lg border"
                style={{ backgroundColor: THEME.cardBg, borderColor: THEME.brownLight }}
              >
                <CardContent className="p-6 md:p-10">
                  <h2
                    className="text-xl md:text-2xl font-bold text-center mb-6"
                    style={{ color: THEME.text }}
                  >
                    แผนภูมิมิติการประเมิน
                  </h2>
                  <RadarChart
                    dimensions={dimensions}
                    fillColor={THEME.red}
                    strokeColor={THEME.brown}
                  />
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
              <Card
                className="rounded-2xl shadow-lg border"
                style={{ backgroundColor: THEME.cardBg, borderColor: THEME.brownLight }}
              >
                <CardContent className="p-6 md:p-10">
                  <h2
                    className="text-xl md:text-2xl font-bold mb-8"
                    style={{ color: THEME.text }}
                  >
                    รายละเอียดคะแนนรายมิติ
                  </h2>
                  <div className="space-y-6">
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
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className="text-sm md:text-base font-semibold truncate"
                                style={{ color: THEME.text }}
                              >
                                {dim.title}
                              </span>
                              <span
                                className="shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full"
                                style={{ backgroundColor: THEME.brownLight, color: THEME.brown }}
                              >
                                น้ำหนัก {dim.weight}%
                              </span>
                            </div>
                            <span
                              className="text-sm font-bold shrink-0 ml-2"
                              style={{ color: THEME.red }}
                            >
                              {dim.weightedScore.toFixed(1)} คะแนน
                            </span>
                          </div>

                          {/* Bar */}
                          <div
                            className="relative h-2.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: THEME.redLight }}
                          >
                            <motion.div
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{ backgroundColor: THEME.red }}
                              initial={{ width: '0%' }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, delay: 1.2 + i * 0.12, ease: 'easeOut' }}
                            />
                          </div>

                          {/* Sub-label */}
                          <div
                            className="flex justify-between mt-1.5 text-xs font-medium"
                            style={{ color: THEME.textMuted }}
                          >
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
                  <div
                    className="mt-8 pt-6 border-t"
                    style={{ borderColor: THEME.brownLight }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold" style={{ color: THEME.text }}>
                        คะแนนถ่วงน้ำหนักรวม
                      </span>
                      <span
                        className="text-2xl font-extrabold"
                        style={{ color: THEME.red }}
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
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 text-base hover:bg-gray-50"
                style={{ borderColor: THEME.brown, color: THEME.brown }}
              >
                <RefreshCw className="h-4 w-4" />
                ทำแบบประเมินอีกครั้ง
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full gap-2 text-base hover:opacity-90"
                style={{ backgroundColor: THEME.red, color: 'white' }}
              >
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
