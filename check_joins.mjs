import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yxknckhlzcjybjbdqnbg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4a25ja2hsemNqeWJqYmRxbmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTY4MTYsImV4cCI6MjA4ODg5MjgxNn0.MA64InqN_hkdrLHPDP3WCigPkTJFlk-mhKEdNa5MPSk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJoins() {
  // Correct join: disease_cases -> hospitals -> wards
  const { data, error } = await supabase
    .from('disease_cases')
    .select(`
      case_id,
      report_date,
      severity,
      status,
      diseases (disease_id, disease_name, disease_category),
      citizens (citizen_id, name, phone),
      hospitals (hospital_id, name, ward_id, wards (ward_id, ward_name)),
      hospital_staff!reported_by (name, designation, department)
    `)
    .limit(5);

  if (error) {
    console.error('Join Error:', error);
  } else {
    console.log('=== CORRECT JOIN STRUCTURE ===');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkJoins();
