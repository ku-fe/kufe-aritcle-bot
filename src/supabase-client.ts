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
    console.log(
      `🔍 저장할 카테고리: ${article.categories.join(', ') || '없음'}`,
    );
    console.log(
      `🔍 카테고리 타입: ${typeof article.categories}, 배열 여부: ${Array.isArray(article.categories)}`,
    );

    if (article.categories.length === 0) {
      console.log(
        '⚠️ 경고: 저장할 카테고리가 없습니다. 태그가 제대로 매핑되지 않았을 수 있습니다.',
      );
    }

    // 데이터 삽입 전 검증 로깅
    const insertData = {
      ...article,
      // PostgreSQL _text 배열 타입과 호환되도록 명시적 변환
      // null이나 undefined 값을 포함하지 않도록 필터링
      categories: article.categories.filter(Boolean),
    };

    // 데이터가 비어있지 않은지 확인
    if (insertData.categories.length === 0) {
      console.log('⚠️ 경고: 필터링 후 카테고리가 비어있어 기본값 추가');
      insertData.categories = ['etc']; // 기본값 추가
    }

    console.log(
      '🔍 Supabase에 삽입할 데이터:',
      JSON.stringify(insertData, null, 2),
    );

    // PostgreSQL 배열 타입으로 categories 처리를 명시적으로 설정
    const { data, error } = await supabase
      .from('articles')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ 아티클 저장 오류:', error.message, error);
      if (error.details) console.error('❌ 오류 세부정보:', error.details);
      if (error.hint) console.error('❌ 오류 힌트:', error.hint);
      throw new Error(`Failed to save article: ${error.message}`);
    }

    console.log(`✅ 아티클 저장 성공! ID: ${data.id}`);
    console.log(`🔍 저장된 데이터:`, JSON.stringify(data, null, 2));

    // 저장된 categories 필드 확인
    console.log(
      `🔍 저장된 카테고리:`,
      data.categories,
      `타입: ${typeof data.categories}`,
    );
    if (!data.categories || data.categories.length === 0) {
      console.log(
        '⚠️ 경고: 저장된 카테고리가 비어 있습니다. Supabase 스키마 확인이 필요할 수 있습니다.',
      );
    }

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
