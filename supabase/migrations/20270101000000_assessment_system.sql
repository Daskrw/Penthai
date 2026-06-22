-- Create enums
DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('short_text', 'paragraph', 'multi_select', 'scale');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE result_level AS ENUM ('seed', 'sapling', 'big_tree');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. assessment_forms
CREATE TABLE IF NOT EXISTS assessment_forms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    instructions text,
    is_active boolean DEFAULT true,
    seed_max_percent integer DEFAULT 40,
    sapling_max_percent integer DEFAULT 70,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. assessment_sections
CREATE TABLE IF NOT EXISTS assessment_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id uuid REFERENCES assessment_forms(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 3. assessment_questions
CREATE TABLE IF NOT EXISTS assessment_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id uuid REFERENCES assessment_sections(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type question_type NOT NULL,
    is_scored boolean DEFAULT false,
    scale_min integer DEFAULT 1,
    scale_max integer DEFAULT 5,
    scale_min_label text DEFAULT 'ไม่เห็นด้วยอย่างยิ่ง',
    scale_max_label text DEFAULT 'เห็นด้วยอย่างยิ่ง',
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 4. assessment_options
CREATE TABLE IF NOT EXISTS assessment_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid REFERENCES assessment_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 5. assessment_responses
CREATE TABLE IF NOT EXISTS assessment_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id uuid REFERENCES assessment_forms(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    total_score integer DEFAULT 0,
    max_possible_score integer DEFAULT 0,
    score_percent numeric(5,2) DEFAULT 0,
    result_level result_level,
    completed_at timestamptz DEFAULT now()
);

-- 6. assessment_answers
CREATE TABLE IF NOT EXISTS assessment_answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id uuid REFERENCES assessment_responses(id) ON DELETE CASCADE,
    question_id uuid REFERENCES assessment_questions(id) ON DELETE CASCADE,
    text_answer text,
    selected_options uuid[],
    scale_value integer,
    score integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE assessment_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessment_forms
DO $$ BEGIN
    CREATE POLICY "Anyone can view active forms" ON assessment_forms FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin can view all forms" ON assessment_forms FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin can insert forms" ON assessment_forms FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin can update forms" ON assessment_forms FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin can delete forms" ON assessment_forms FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS Policies for assessment_sections
DO $$ BEGIN
    CREATE POLICY "Anyone can view sections" ON assessment_sections FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin can manage sections" ON assessment_sections FOR ALL USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS Policies for assessment_questions
DO $$ BEGIN
    CREATE POLICY "Anyone can view questions" ON assessment_questions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin can manage questions" ON assessment_questions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS Policies for assessment_options
DO $$ BEGIN
    CREATE POLICY "Anyone can view options" ON assessment_options FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin can manage options" ON assessment_options FOR ALL USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS Policies for assessment_responses
DO $$ BEGIN
    CREATE POLICY "Users can view own responses" ON assessment_responses FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin can view all responses" ON assessment_responses FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can insert responses" ON assessment_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS Policies for assessment_answers
DO $$ BEGIN
    CREATE POLICY "Users can view own answers" ON assessment_answers FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assessment_responses
            WHERE assessment_responses.id = assessment_answers.response_id
            AND assessment_responses.user_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin can view all answers" ON assessment_answers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can insert answers" ON assessment_answers FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM assessment_responses
            WHERE assessment_responses.id = assessment_answers.response_id
            AND assessment_responses.user_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- SEED DATA
DO $$ 
DECLARE
    form_id uuid := 'f0000000-0000-0000-0000-000000000001';
    section1_id uuid := 'b0000000-0000-0000-0000-000000000001';
    section2_id uuid := 'b0000000-0000-0000-0000-000000000002';
    section3_id uuid := 'b0000000-0000-0000-0000-000000000003';
    q3_id uuid := 'c0000000-0000-0000-0000-000000000003';
BEGIN
    -- Insert Form
    INSERT INTO assessment_forms (id, title, description, instructions, seed_max_percent, sapling_max_percent)
    VALUES (
        form_id, 
        'แบบประเมินความพร้อมการพัฒนาซอฟต์พาวเวอร์ของชุมชน', 
        'แบบฟอร์มนี้ใช้เพื่อประเมินศักยภาพและความพร้อมในการนำต้นทุนวัฒนธรรมหรือภูมิปัญญาท้องถิ่นมาพัฒนาเป็น ซอฟต์พาวเวอร์ (Soft Power) เชิงพาณิชย์',
        NULL,
        40, 
        70
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert Sections
    INSERT INTO assessment_sections (id, form_id, title, description, sort_order) VALUES
    (section1_id, form_id, 'ส่วนที่ 1: ข้อมูลทั่วไปของชุมชน', NULL, 1),
    (section2_id, form_id, 'ส่วนที่ 2: เกณฑ์การประเมินความพร้อม 4 ด้านหลัก', 'โปรดเลือกระดับความคิดเห็นที่ตรงกับสภาพความเป็นจริงของชุมชนท่านมากที่สุด (5 = เห็นด้วยอย่างยิ่ง/มากที่สุด, 4 = เห็นด้วย/มาก, 3 = ปานกลาง, 2 = ไม่เห็นด้วย/น้อย, 1 = ไม่เห็นด้วยอย่างยิ่ง/น้อยที่สุด)', 2),
    (section3_id, form_id, 'ส่วนที่ 3: สรุปและข้อเสนอแนะเพิ่มเติม', NULL, 3)
    ON CONFLICT (id) DO NOTHING;

    -- Insert Questions for Section 1
    INSERT INTO assessment_questions (id, section_id, question_text, question_type, is_scored, sort_order) VALUES
    ('c0000000-0000-0000-0000-000000000001', section1_id, 'ชื่อชุมชน / หมู่บ้าน / กลุ่มวิสาหกิจชุมชน', 'short_text', false, 1),
    ('c0000000-0000-0000-0000-000000000002', section1_id, 'ที่ตั้ง (ตำบล / อำเภอ / จังหวัด)', 'short_text', false, 2),
    (q3_id, section1_id, 'ประเภทของต้นทุนวัฒนธรรมหลักในชุมชน (เลือกได้มากกว่า 1 ข้อ)', 'multi_select', false, 3)
    ON CONFLICT (id) DO NOTHING;

    -- Insert Options for Q3
    INSERT INTO assessment_options (id, question_id, option_text, sort_order) VALUES
    ('d0000000-0000-0000-0000-000000000001', q3_id, 'อาหารและเครื่องดื่มท้องถิ่น (Food)', 1),
    ('d0000000-0000-0000-0000-000000000002', q3_id, 'ผ้าท้องถิ่น หัตถกรรม และเครื่องแต่งกาย (Fashion / Arts & Crafts)', 2),
    ('d0000000-0000-0000-0000-000000000003', q3_id, 'เทศกาล ประเพณี และพิธีกรรมความเชื่อ (Festival)', 3),
    ('d0000000-0000-0000-0000-000000000004', q3_id, 'สถานที่ท่องเที่ยว วิถีชีวิต หรือประวัติศาสตร์ท้องถิ่น (Tourism / Storytelling)', 4),
    ('d0000000-0000-0000-0000-000000000005', q3_id, 'ศิลปะการแสดง ดนตรี หรือกีฬาท้องถิ่น (Entertainment / Fighting)', 5)
    ON CONFLICT (id) DO NOTHING;

    -- Insert Questions for Section 2 (Scale questions)
    INSERT INTO assessment_questions (id, section_id, question_text, question_type, is_scored, scale_min, scale_max, sort_order) VALUES
    ('c0000000-0000-0000-0000-000000000004', section2_id, 'สินค้าหรือวัฒนธรรมของชุมชนมีอัตลักษณ์ เอกลักษณ์ ไม่ซ้ำใคร และมีจุดด่างที่โดดเด่น', 'scale', true, 1, 5, 1),
    ('c0000000-0000-0000-0000-000000000005', section2_id, 'ชุมชนมีเรื่องราว ตำนาน หรือประวัติศาสตร์ที่น่าสนใจและชวนติดตาม', 'scale', true, 1, 5, 2),
    ('c0000000-0000-0000-0000-000000000006', section2_id, 'ต้นทุนทางวัฒนธรรมสามารถนำมาประยุกต์หรือดีไซน์ให้โมเดิร์นเข้ากับคนรุ่นใหม่ได้ง่าย', 'scale', true, 1, 5, 3),
    ('c0000000-0000-0000-0000-000000000007', section2_id, 'ชุมชนมีความพร้อมผลิตหรือให้บริการได้ตลอดทั้งปี โดยไม่มีปัญหาขาดแคลนวัตถุดิบและบุคลากร', 'scale', true, 1, 5, 4),
    ('c0000000-0000-0000-0000-000000000008', section2_id, 'ชุมชนมีปราชญ์ชาวบ้าน ผู้เชี่ยวชาญ และมีคนรุ่นใหม่มารับช่วงต่อภูมิปัญญา', 'scale', true, 1, 5, 5),
    ('c0000000-0000-0000-0000-000000000009', section2_id, 'ผู้นำและการบริหารจัดการกลุ่มมีการแบ่งฝ่ายและหน้าที่ความรับผิดชอบอย่างเป็นระบบ', 'scale', true, 1, 5, 6),
    ('c0000000-0000-0000-0000-000000000010', section2_id, 'แกนนำหรือกลุ่มมีความพร้อมและเปิดรับการเรียนรู้ระบบออนไลน์ รวมถึงเครื่องมือใหม่ๆ', 'scale', true, 1, 5, 7),
    ('c0000000-0000-0000-0000-000000000011', section2_id, 'ชาวบ้านในชุมชนมีความสามัคคี มีส่วนร่วม และเห็นพ้องที่จะขับเคลื่อนงานร่วมกัน', 'scale', true, 1, 5, 8),
    ('c0000000-0000-0000-0000-000000000012', section2_id, 'ชุมชนมีพื้นที่เรียนรู้ ศูนย์บริการ ศาลา หรือหน้าร้านที่เป็นสัดส่วนและสะอาด', 'scale', true, 1, 5, 9),
    ('c0000000-0000-0000-0000-000000000013', section2_id, 'ชุมชนมีระบบสุขอนามัย ห้องน้ำ ระบบจัดการขยะ และความปลอดภัยที่พร้อมรองรับคนภายนอก', 'scale', true, 1, 5, 10),
    ('c0000000-0000-0000-0000-000000000014', section2_id, 'ชุมชนมีเครือข่ายสนับสนุนภายนอก (เช่น อบต. มหาวิทยาลัย หรือหน่วยงานรัฐ/เอกชน) คอยช่วยเหลืออย่างต่อเนื่อง', 'scale', true, 1, 5, 11),
    ('c0000000-0000-0000-0000-000000000015', section2_id, 'ภายในกลุ่มมีกฎระเบียบ กติกา และระบบจัดสรรผลประโยชน์ที่เป็นธรรม', 'scale', true, 1, 5, 12),
    ('c0000000-0000-0000-0000-000000000016', section2_id, 'ผลิตภัณฑ์ของชุมชนมีความพร้อม มีแบรนด์ โลโก้ บรรจุภัณฑ์สวยงาม หรือได้มาตรฐาน (เช่น อย./มผช.)', 'scale', true, 1, 5, 13),
    ('c0000000-0000-0000-0000-000000000017', section2_id, 'ชุมชนมีช่องทางการตลาดออนไลน์ (เช่น Facebook, TikTok, Line OA) และมีการโพสต์อย่างสม่ำเสมอ', 'scale', true, 1, 5, 14),
    ('c0000000-0000-0000-0000-000000000018', section2_id, 'กลุ่มมีการทำบัญชี คำนวณต้นทุนจริง และตั้งราคาที่ทำให้กลุ่มมีกำไรอย่างชัดเจน', 'scale', true, 1, 5, 15),
    ('c0000000-0000-0000-0000-000000000019', section2_id, 'ชุมชนมีการเชื่อมโยงเครือข่ายท่องเที่ยว มีชื่อในโปรแกรมท่องเที่ยว หรือเดินทางเข้าถึงได้ง่ายและสะดวก', 'scale', true, 1, 5, 16)
    ON CONFLICT (id) DO NOTHING;

    -- Insert Questions for Section 3
    INSERT INTO assessment_questions (id, section_id, question_text, question_type, is_scored, sort_order) VALUES
    ('c0000000-0000-0000-0000-000000000020', section3_id, 'จุดเด่นที่สุดของชุมชนที่สามารถนำมาโปรโมตเป็น Soft Power ได้ทันทีคืออะไร?', 'paragraph', false, 1),
    ('c0000000-0000-0000-0000-000000000021', section3_id, 'อุปสรรคหรือสิ่งที่ชุมชนต้องการความช่วยเหลือเพื่อพัฒนาต่อยอดเร่งด่วนที่สุดคืออะไร?', 'paragraph', false, 2)
    ON CONFLICT (id) DO NOTHING;

END $$;
