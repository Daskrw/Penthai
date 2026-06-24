import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, Home, Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// --- Level Images ---
import imgLevel1 from '@/assets/01.jpg';
import imgLevel2 from '@/assets/02.jpg';
import imgLevel3 from '@/assets/03.jpg';

const LEVEL_IMAGES: Record<ResultLevel, string> = {
  seed: imgLevel1,
  sapling: imgLevel2,
  big_tree: imgLevel3,
};

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

  const maxAxisValue = Math.max(...dimensions.map(d => d.weight), 10);

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (value / maxAxisValue) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0].map(pct => pct * maxAxisValue);

  const maxWeightPoints = dimensions.map((d, i) => getPoint(i, d.weight));
  const maxWeightPath = maxWeightPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + 'Z';

  const dataPoints = dimensions.map((d, i) => getPoint(i, d.weightedScore));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + 'Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full max-w-[400px] mx-auto aspect-square overflow-visible">
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
        const end = getPoint(i, maxAxisValue);
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

      <path
        d={maxWeightPath}
        fill={strokeColor}
        fillOpacity={0.05}
        stroke={strokeColor}
        strokeWidth={1}
        strokeDasharray="4 4"
      />

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
        const labelPoint = getPoint(i, maxAxisValue * 1.25);
        return (
          <text
            key={`label-${i}`}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fill: THEME.text }}
            className="text-[10px] md:text-xs font-bold"
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
  const [communityName, setCommunityName] = useState<string>('');
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

        // Fetch answers with question sort order so we can find the very first short_text question (Community Name)
        const { data: answersData, error: answersError } = await supabase
          .from('assessment_answers')
          .select('*, assessment_questions(sort_order)')
          .eq('response_id', responseId);

        if (answersError) throw answersError;

        const answerMap = new Map<string, number>();
        for (const a of answersData || []) {
          if (a.scale_value != null) {
            answerMap.set(a.question_id, a.scale_value);
          }
        }

        // Find community name
        const textAnswers = (answersData || []).filter((a: any) => a.text_answer && a.text_answer.trim() !== '');
        if (textAnswers.length > 0) {
          textAnswers.sort((a: any, b: any) => {
            const orderA = a.assessment_questions?.sort_order || 0;
            const orderB = b.assessment_questions?.sort_order || 0;
            return orderA - orderB;
          });
          setCommunityName(textAnswers[0].text_answer);
        } else {
          setCommunityName('ผลการประเมินชุมชน');
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
        <main className="min-h-[80vh] flex flex-col items-center justify-center font-prompt bg-stone-50">
          <Loader2 className="h-12 w-12 animate-spin mb-4 text-red-700" />
          <p className="text-lg text-stone-500">กำลังประมวลผล...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex items-center justify-center px-4 font-prompt bg-stone-50">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-stone-900">กรุณาเข้าสู่ระบบ</h2>
            <Button onClick={() => navigate('/auth')} className="bg-red-700 hover:bg-red-800 text-white">
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
        <main className="min-h-[80vh] flex items-center justify-center px-4 font-prompt bg-stone-50">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="h-16 w-16 mx-auto text-red-700" />
            <h2 className="text-2xl font-bold text-stone-900">เกิดข้อผิดพลาด</h2>
            <p className="text-stone-500">{error}</p>
            <Button onClick={() => navigate('/assessment')} className="bg-red-700 hover:bg-red-800 text-white">
              กลับไปหน้าประเมิน
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const hasNoData = dimensions.length === 0 || dimensions.every(d => d.rawScore === 0);

  const levelKey: ResultLevel = response.result_level || 'seed';
  const levelData = RESULT_LEVELS[levelKey];
  const levelImage = LEVEL_IMAGES[levelKey];

  return (
    <>
      <Navbar />
      <main className="min-h-screen font-prompt bg-[#FAFAFA] pb-20">
        
        {/* 1. TOP SECTION: Hero Result (Full Width) */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full bg-white border-b border-stone-200 py-12 md:py-20 px-4"
        >
          <div className="container mx-auto max-w-6xl">
            {hasNoData ? (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-700" />
                <h2 className="text-2xl font-bold mb-2 text-stone-900">ข้อมูลการประเมินไม่สมบูรณ์</h2>
                <p className="mb-8 text-stone-500">
                  ระบบได้รับการอัปเดตแบบสอบถามใหม่ ทำให้ข้อมูลผลการประเมินเดิมไม่สามารถแสดงผลได้ กรุณาทำแบบประเมินใหม่อีกครั้ง
                </p>
                <Button onClick={() => navigate('/assessment')} size="lg" className="bg-red-700 hover:bg-red-800 text-white">
                  <RefreshCw className="w-4 h-4 mr-2" /> ทำแบบประเมินใหม่
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
                {/* Left: Text */}
                <div className="text-center md:text-left space-y-6">
                  <h1 className="text-4xl md:text-6xl font-extrabold text-stone-900 leading-tight">
                    {communityName}
                  </h1>
                  <div className="inline-block px-8 py-3 rounded-full bg-red-50 border border-red-100">
                    <p className="text-xl md:text-2xl font-bold text-red-700">
                      ขอแสดงความยินดี ชุมชนของท่านได้รับการประเมินอยู่ในระดับ "{levelData.thaiName}"
                    </p>
                  </div>
                </div>

                {/* Right: Image */}
                <div className="flex justify-center md:justify-end">
                  <img 
                    src={levelImage} 
                    alt={levelData.thaiName} 
                    className="w-full max-w-[320px] md:max-w-[450px] rounded-[2rem] shadow-xl object-cover aspect-square" 
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16 space-y-8">
          
          {/* 2. MIDDLE SECTION: Detailed Description */}
          {!hasNoData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white rounded-[2rem] shadow-sm border border-stone-200 p-8 md:p-12 text-center"
            >
              <h2 className="text-xl md:text-2xl font-bold text-stone-900 mb-6">รายละเอียดผลการประเมิน</h2>
              <div className="max-w-4xl mx-auto space-y-4 text-left md:text-center">
                {levelData.detailedDescription ? (
                  levelData.detailedDescription.split('\n').map((paragraph, idx) => (
                    paragraph.trim() !== '' && (
                      <p key={idx} className="text-stone-600 leading-relaxed text-sm md:text-base md:text-justify text-left">
                        {paragraph}
                      </p>
                    )
                  ))
                ) : (
                  <p className="text-stone-600 leading-relaxed text-sm md:text-base">
                    {levelData.description}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* 3. BOTTOM SECTION: Spider Chart */}
          {!hasNoData && dimensions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-white rounded-[2rem] shadow-sm border border-stone-200 p-8 md:p-12 text-center"
            >
              <h2 className="text-xl md:text-2xl font-bold text-stone-900 mb-8">วิเคราะห์ศักยภาพรายมิติ</h2>
              <div className="w-full max-w-3xl mx-auto aspect-square flex items-center justify-center">
                <RadarChart dimensions={dimensions} fillColor={THEME.red} strokeColor={THEME.brown} />
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <Link to="/assessment" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full h-12 md:h-14 px-8 text-base shadow-sm border-stone-200 hover:bg-stone-50 text-stone-700 rounded-full font-medium">
                <RefreshCw className="h-4 w-4 mr-2" /> ทำแบบประเมินอีกครั้ง
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-12 md:h-14 px-8 text-base shadow-md bg-red-700 hover:bg-red-800 text-white rounded-full font-medium">
                <Home className="h-4 w-4 mr-2" /> กลับหน้าหลัก
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
