import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
);

// 연결 테스트 함수
export async function createSupabaseClient(): Promise<void> {
  try {
    // 테스트 쿼리 실행
    const { data, error } = await supabase
      .from('articles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase 연결 오류:', error.message);
      throw new Error(`Supabase connection error: ${error.message}`);
    }
  } catch (error) {
    console.error('Supabase 클라이언트 초기화 실패:', error);
    throw error;
  }
}

// URL로 아티클 조회
export async function getArticleByUrl(url: string) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('url', url)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116: 결과가 없는 경우
      console.error('아티클 조회 오류:', error.message);
    }

    return data;
  } catch (error) {
    console.error('아티클 조회 중 오류 발생:', error);
    return null;
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
    // 데이터 삽입 전 검증
    const insertData = {
      ...article,
      // PostgreSQL _text 배열 타입과 호환되도록 명시적 변환
      // null이나 undefined 값을 포함하지 않도록 필터링
      categories: article.categories.filter(Boolean),
    };

    // 데이터가 비어있지 않은지 확인
    if (insertData.categories.length === 0) {
      insertData.categories = ['etc']; // 기본값 추가
    }

    // PostgreSQL 배열 타입으로 categories 처리를 명시적으로 설정
    const { data, error } = await supabase
      .from('articles')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('아티클 저장 오류:', error.message, error);
      if (error.details) console.error('오류 세부정보:', error.details);
      if (error.hint) console.error('오류 힌트:', error.hint);
      throw new Error(`Failed to save article: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('아티클 저장 중 오류 발생:', error);
    throw error;
  }
}
