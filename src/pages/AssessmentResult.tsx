import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, Home, Loader2, AlertCircle, BarChart3, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  if (!dimensions || dimensions.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center opacity-70">
        <BarChart3 className="w-12 h-12 mb-4" style={{ color: THEME.brown }} />
        <p style={{ color: THEME.textMuted }}>ไม่มีข้อมูลเพียงพอในการสร้างแผนภูมิเรดาร์</p>
      </div>
    );
  }

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

  const dataPoints = dimensions.map((d, i) => {
    const normalizedPercent = d.maxRawScore > 0 ? (d.rawScore / d.maxRawScore) * 100 : 0;
    return getPoint(i, normalizedPercent);
  });
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + 'Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] mx-auto">
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
            className="text-[11px] font-bold"
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
        const { data: responseData, error: responseError } = await supabase
          .from('assessment_responses')
          .select(`*, assessment_forms ( title )`)
          .eq('id', responseId)
          .single();

        if (responseError) throw responseError;
        if (!responseData) throw new Error('ไม่พบข้อมูล');

        setResponse(responseData as any);
        const formId = responseData.form_id;

        const { data: sectionsData, error: sectionsError } = await supabase
          .from('assessment_sections')
          .select(`*, assessment_questions ( id, is_scored )`)
          .eq('form_id', formId)
          .order('sort_order', { ascending: true });

        if (sectionsError) throw sectionsError;

        const { data: answersData, error: answersError } = await supabase
          .from('assessment_answers')
          .select('*')
          .eq('response_id', responseId);

        if (answersError) throw answersError;

        const answerMap = new Map<string, number>();
        for (const a of answersData || []) {
          if (a.scale_value != null) {
            answerMap.set(a.question_id, a.scale_value);
          }
        }

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
          const weight = section.weight_percent ?? 0;
          const weightedScore =
            maxRawScore > 0 ? (rawScore / maxRawScore) * weight : 0;

          const shortTitle =
            DIMENSION_SHORT_TITLES[section.title] ||
            section.title.replace(/^มิติที่\s*\d+\s*:\s*/, '').slice(0, 15);

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
        setError('ไม่สามารถโหลดผลการประเมินได้ อาจเป็นเพราะมีการอัปเดตระบบ กรุณาทำแบบประเมินใหม่');
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
        <main className="min-h-[80vh] flex flex-col items-center justify-center" style={{ backgroundColor: THEME.bg }}>
          <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: THEME.red }} />
          <p className="text-lg" style={{ color: THEME.textMuted }}>กำลังประมวลผล...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex items-center justify-center px-4" style={{ backgroundColor: THEME.bg }}>
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: THEME.text }}>กรุณาเข้าสู่ระบบ</h2>
            <Button onClick={() => navigate('/auth')} style={{ backgroundColor: THEME.red, color: 'white' }}>
              เข้าสู่ระบบ
            </Button>
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
        <main className="min-h-[80vh] flex items-center justify-center px-4" style={{ backgroundColor: THEME.bg }}>
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="h-16 w-16 mx-auto" style={{ color: THEME.red }} />
            <h2 className="text-2xl font-bold" style={{ color: THEME.text }}>เกิดข้อผิดพลาด</h2>
            <p style={{ color: THEME.textMuted }}>{error}</p>
            <Button onClick={() => navigate('/assessment')} style={{ backgroundColor: THEME.red, color: 'white' }}>
              กลับไปหน้าประเมิน
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ─── If Data is Missing (Old Response Error) ─────────────────────────
  const hasNoData = dimensions.length === 0 || dimensions.every(d => d.rawScore === 0);

  const levelKey: ResultLevel = response.result_level || 'seed';
  const levelData = RESULT_LEVELS[levelKey];
  const percent = hasNoData ? 0 : response.score_percent ?? 0;
  
  const circleRadius = 80;
  const circumference = 2 * Math.PI * circleRadius;
  const targetDash = (percent / 100) * circumference;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-20" style={{ backgroundColor: THEME.bg }}>
        
        {/* ──────── 1. Header ──────── */}
        <div className="pt-20 pb-32 px-4 border-b border-opacity-20" style={{ backgroundColor: THEME.cardBg, borderColor: THEME.brown }}>
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight" style={{ color: THEME.text }}>
                ผลการประเมิน PCGA
              </h1>
              <p className="text-lg md:text-xl font-medium" style={{ color: THEME.textMuted }}>
                {response.assessment_forms?.title}
              </p>
            </motion.div>
          </div>
        </div>

        {/* ──────── 2. Main Result Card ──────── */}
        <div className="container mx-auto max-w-4xl px-4 -mt-24 relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-3xl shadow-xl border overflow-hidden" style={{ backgroundColor: THEME.cardBg, borderColor: THEME.brownLight }}>
              {hasNoData ? (
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: THEME.red }} />
                  <h2 className="text-2xl font-bold mb-2" style={{ color: THEME.text }}>ข้อมูลการประเมินไม่สมบูรณ์</h2>
                  <p className="mb-8" style={{ color: THEME.textMuted }}>
                    ระบบได้รับการอัปเดตแบบสอบถามใหม่ ทำให้ข้อมูลผลการประเมินเดิมไม่สามารถแสดงผลได้ กรุณาทำแบบประเมินใหม่อีกครั้ง
                  </p>
                  <Button onClick={() => navigate('/assessment')} size="lg" style={{ backgroundColor: THEME.red, color: 'white' }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> ทำแบบประเมินใหม่
                  </Button>
                </CardContent>
              ) : (
                <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: THEME.brownLight }}>
                  
                  {/* Left: Overall Score */}
                  <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
                    <h2 className="text-xl font-bold mb-6" style={{ color: THEME.text }}>คะแนนรวมของคุณ</h2>
                    <div className="relative w-48 h-48 mb-6">
                      <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                        <circle cx="100" cy="100" r={circleRadius} fill="transparent" stroke={THEME.brownLight} strokeWidth={12} />
                        <motion.circle
                          cx="100" cy="100" r={circleRadius} fill="transparent"
                          stroke={THEME.red} strokeWidth={12} strokeLinecap="round"
                          initial={{ strokeDasharray: `0 ${circumference}` }}
                          animate={{ strokeDasharray: `${targetDash} ${circumference}` }}
                          transition={{ duration: 2, ease: 'easeOut', delay: 0.5 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span className="text-5xl font-extrabold" style={{ color: THEME.text }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                          {Math.round(percent)}
                        </motion.span>
                        <span className="text-sm font-semibold mt-1" style={{ color: THEME.textMuted }}>
                          / 100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Level & Radar */}
                  <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center bg-stone-50/50">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full text-4xl mb-4 bg-white shadow-sm border" style={{ borderColor: THEME.brownLight }}>
                      {levelData.icon}
                    </div>
                    <h3 className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: THEME.brown }}>ระดับชุมชน</h3>
                    <h2 className="text-3xl font-extrabold mb-3" style={{ color: THEME.red }}>{levelData.thaiName}</h2>
                    <p className="text-sm font-medium mb-6 px-4" style={{ color: THEME.textMuted }}>{levelData.description}</p>
                    <div className="w-full max-w-[280px] sm:max-w-[320px] mx-auto mt-auto pt-4 border-t" style={{ borderColor: THEME.brownLight }}>
                      <RadarChart dimensions={dimensions} fillColor={THEME.red} strokeColor={THEME.brown} />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* ──────── 3. Data Visualization Table ──────── */}
        {!hasNoData && dimensions.length > 0 && (
          <div className="container mx-auto max-w-4xl px-4 mt-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: THEME.cardBg, borderColor: THEME.brownLight }}>
                <CardHeader className="bg-stone-50 border-b" style={{ borderColor: THEME.brownLight }}>
                  <CardTitle className="flex items-center gap-2 text-xl" style={{ color: THEME.text }}>
                    <BarChart3 className="w-5 h-5" style={{ color: THEME.brown }} /> 
                    ตารางวิเคราะห์รายมิติ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b bg-white text-sm" style={{ borderColor: THEME.brownLight, color: THEME.textMuted }}>
                          <th className="p-4 font-semibold">มิติการประเมิน</th>
                          <th className="p-4 font-semibold text-center">คะแนนดิบ</th>
                          <th className="p-4 font-semibold text-center">สัดส่วนน้ำหนัก</th>
                          <th className="p-4 font-semibold text-right">คะแนนสุทธิ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: THEME.brownLight }}>
                        {dimensions.map((dim, i) => {
                          const pct = dim.maxRawScore > 0 ? Math.round((dim.rawScore / dim.maxRawScore) * 100) : 0;
                          return (
                            <motion.tr 
                              key={dim.sectionId}
                              initial={{ opacity: 0, backgroundColor: 'rgba(255,255,255,0)' }} 
                              animate={{ opacity: 1, backgroundColor: 'rgba(255,255,255,1)' }} 
                              transition={{ delay: 0.8 + i * 0.1 }}
                              className="hover:bg-stone-50 transition-colors"
                            >
                              <td className="p-4">
                                <p className="font-bold text-sm md:text-base" style={{ color: THEME.text }}>{dim.title}</p>
                                <div className="mt-2 w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                                  <motion.div 
                                    className="h-full rounded-full" style={{ backgroundColor: THEME.red }}
                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 1.2, duration: 1 }}
                                  />
                                </div>
                              </td>
                              <td className="p-4 text-center font-medium" style={{ color: THEME.textMuted }}>
                                {dim.rawScore} <span className="text-xs">/ {dim.maxRawScore}</span>
                              </td>
                              <td className="p-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: THEME.brownLight, color: THEME.brown }}>
                                  {dim.weight}%
                                </span>
                              </td>
                              <td className="p-4 text-right font-extrabold text-lg" style={{ color: THEME.red }}>
                                {dim.weightedScore.toFixed(1)}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-stone-50 border-t" style={{ borderColor: THEME.brownLight }}>
                        <tr>
                          <td colSpan={3} className="p-4 text-right font-bold" style={{ color: THEME.text }}>คะแนนถ่วงน้ำหนักรวม (Total Score)</td>
                          <td className="p-4 text-right font-extrabold text-2xl" style={{ color: THEME.red }}>{Math.round(percent)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* ──────── 4. Info & Action Buttons ──────── */}
        <div className="container mx-auto max-w-4xl px-4 mt-8 mb-12">
          {!hasNoData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mb-8 p-4 rounded-xl border flex items-start gap-3 bg-white" style={{ borderColor: THEME.brownLight }}>
              <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: THEME.brown }} />
              <p className="text-sm leading-relaxed" style={{ color: THEME.textMuted }}>
                <strong>หมายเหตุ:</strong> คะแนนสุทธิคำนวณจาก (คะแนนดิบ ÷ คะแนนเต็มของมิตินั้น) × สัดส่วนน้ำหนัก % ซึ่งสะท้อนความพร้อมของชุมชนในแต่ละด้านอย่างเป็นระบบ
              </p>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/assessment" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full gap-2 text-base shadow-sm hover:bg-stone-50" style={{ borderColor: THEME.brown, color: THEME.brown }}>
                <RefreshCw className="h-4 w-4" /> ทำแบบประเมินอีกครั้ง
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 text-base shadow-md hover:opacity-90" style={{ backgroundColor: THEME.red, color: 'white' }}>
                <Home className="h-4 w-4" /> กลับหน้าหลัก
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
