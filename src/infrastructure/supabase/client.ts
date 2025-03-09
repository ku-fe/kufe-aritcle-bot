import { createClient } from '@supabase/supabase-js';
import { env } from '@config/config';
import { DatabaseError } from '@/types/errors';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

export async function initializeSupabaseClient(): Promise<void> {
  try {
    const { error } = await supabase.from('articles').select('id').limit(1);
    if (error) throw new DatabaseError(error.message);
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
} 