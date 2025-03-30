import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 설정 가져오기
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey);

// 연결 테스트 함수
export async function createSupabaseClient(): Promise<void> {
  try {
    console.log('🔍 Supabase 연결 확인 중...');

    // 테스트 쿼리 실행
    const { data, error } = await supabase
      .from('articles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase 연결 오류:', error.message);
      throw new Error(`Supabase connection error: ${error.message}`);
    }

    console.log(
      `✅ Supabase 연결 성공! 테스트 데이터: ${JSON.stringify(data)}`,
    );
  } catch (error) {
    console.error('❌ Supabase 클라이언트 초기화 실패:', error);
    throw error;
  }
}

// 아티클 저장 함수
export async function saveArticle(article: {
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  submitted_by: string;
  submitted_at: string;
  channel_id: string;
  categories: string[];
}) {
  try {
    console.log(`🔍 아티클 저장 시도: ${article.title}`);

    const { data, error } = await supabase
      .from('articles')
      .insert([article])
      .select()
      .single();

    if (error) {
      console.error('❌ 아티클 저장 오류:', error.message);
      throw new Error(`Failed to save article: ${error.message}`);
    }

    console.log(`✅ 아티클 저장 성공! ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('❌ 아티클 저장 중 오류 발생:', error);
    throw error;
  }
}

// URL로 아티클 조회
export async function getArticleByUrl(url: string) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select()
      .eq('url', url)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      console.error('❌ 아티클 조회 오류:', error.message);
      throw new Error(`Failed to get article: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('❌ 아티클 조회 중 오류 발생:', error);
    throw error;
  }
}
