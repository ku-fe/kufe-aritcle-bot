import { env } from '@/config/config';
import { DatabaseError } from '@/types/errors';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

export async function initializeSupabaseClient(): Promise<void> {
  try {
    const { error } = await supabase.from('articles').select('id').limit(1);
    if (error) throw new DatabaseError(error.message);
    console.log('Supabase 클라이언트가 성공적으로 초기화되었습니다');
  } catch (error) {
    console.error('Supabase 클라이언트 초기화 실패:', error);
    throw error;
  }
}
