"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const defaultUrl = 'https://yxknckhlzcjybjbdqnbg.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4a25ja2hsemNqeWJqYmRxbmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTY4MTYsImV4cCI6MjA4ODg5MjgxNn0.MA64InqN_hkdrLHPDP3WCigPkTJFlk-mhKEdNa5MPSk';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultKey;

export const supabase = createSupabaseClient(
  supabaseUrl,
  supabasePublishableKey,
);

export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
