import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yxknckhlzcjybjbdqnbg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4a25ja2hsemNqeWJqYmRxbmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTY4MTYsImV4cCI6MjA4ODg5MjgxNn0.MA64InqN_hkdrLHPDP3WCigPkTJFlk-mhKEdNa5MPSk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('=== DISEASE_CASES TABLE ===');
  const { data: diseaseCases, error: dcError } = await supabase
    .from('disease_cases')
    .select('*')
    .limit(2);
  
  if (dcError) {
    console.error('Error:', dcError);
  } else if (diseaseCases && diseaseCases.length > 0) {
    console.log('Columns:', Object.keys(diseaseCases[0]));
    console.log('Sample:', JSON.stringify(diseaseCases, null, 2));
  } else {
    console.log('No data found in disease_cases');
  }

  console.log('\n=== DISEASES TABLE ===');
  const { data: diseases } = await supabase.from('diseases').select('*').limit(3);
  console.log('Columns:', diseases?.[0] ? Object.keys(diseases[0]) : []);
  console.log('Sample:', JSON.stringify(diseases, null, 2));

  console.log('\n=== WARDS TABLE ===');
  const { data: wards } = await supabase.from('wards').select('*').limit(3);
  console.log('Columns:', wards?.[0] ? Object.keys(wards[0]) : []);
  console.log('Sample:', JSON.stringify(wards, null, 2));

  console.log('\n=== HOSPITALS TABLE ===');
  const { data: hospitals } = await supabase.from('hospitals').select('*').limit(2);
  console.log('Columns:', hospitals?.[0] ? Object.keys(hospitals[0]) : []);

  console.log('\n=== HOSPITAL_STAFF TABLE ===');
  const { data: staff } = await supabase.from('hospital_staff').select('*').limit(2);
  console.log('Columns:', staff?.[0] ? Object.keys(staff[0]) : []);

  console.log('\n=== DISEASE_CASES WITH JOINS ===');
  const { data: fullData, error: fullError } = await supabase
    .from('disease_cases')
    .select(`
      *,
      diseases (disease_id, disease_name, disease_category),
      citizens (citizen_id, name, phone),
      hospitals (hospital_id, name),
      wards (ward_id, ward_name)
    `)
    .limit(3);

  if (fullError) {
    console.error('Join Error:', fullError);
  } else {
    console.log('Full data with joins:', JSON.stringify(fullData, null, 2));
  }
}

checkSchema();
