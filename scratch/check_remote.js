import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qyfasmdsneeidojtrqvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmFzbWRzbmVlaWRvanRycXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjgzNzcsImV4cCI6MjA5NzA0NDM3N30.yCCvlTinurKXizc3WdsA7sML65m9HPUlzDcZSTjNyNQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
  console.log('Checking assessment_sections...');
  const { data: sections, error: secErr } = await supabase
    .from('assessment_sections')
    .select('id, title, weight_percent, sort_order');
  
  if (secErr) {
    console.error('Error sections:', secErr);
  } else {
    console.log('Sections:', sections);
  }

  console.log('\nChecking assessment_forms...');
  const { data: forms, error: formErr } = await supabase
    .from('assessment_forms')
    .select('*');
  
  if (formErr) {
    console.error('Error forms:', formErr);
  } else {
    console.log('Forms:', forms);
  }
}

checkDB();
