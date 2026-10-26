import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const keyPreview = supabaseKey ? `${supabaseKey.substring(0, 20)}...${supabaseKey.substring(supabaseKey.length - 20)}` : 'NOT SET';
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ 
      error: 'Missing configuration',
      url: supabaseUrl || 'NOT SET',
      keyPreview 
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const tests: Record<string, unknown> = {};
  
  const { data: citizens, error: citizensError, count: citizensCount } = await supabase
    .from('citizens')
    .select('*', { count: 'exact' })
    .limit(1);
  tests.citizens = { count: citizensCount, error: citizensError?.message, sample: citizens?.[0] };
  
  const { data: beds, error: bedsError, count: bedsCount } = await supabase
    .from('beds')
    .select('*', { count: 'exact' })
    .limit(1);
  tests.beds = { count: bedsCount, error: bedsError?.message, sample: beds?.[0] };
  
  const { data: hospitals, error: hospitalsError } = await supabase
    .from('hospitals')
    .select('*')
    .limit(1);
  tests.hospitals = { error: hospitalsError?.message, sample: hospitals?.[0] };
  
  return NextResponse.json({
    config: {
      url: supabaseUrl,
      keyLength: supabaseKey?.length,
      keyPreview
    },
    tests,
    timestamp: new Date().toISOString()
  });
}
