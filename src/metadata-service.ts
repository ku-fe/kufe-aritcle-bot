import ogs from 'open-graph-scraper';

// 메타데이터 인터페이스
export interface ArticleMetadata {
  title: string;
  description: string | null;
  imageUrl: string | null;
}

// URL에서 메타데이터 추출 함수
export async function extractMetadata(
  url: string,
): Promise<ArticleMetadata | null> {
  try {
    console.log(`🔍 URL 메타데이터 추출 중: ${url}`);

    const { result, error } = await ogs({ url });

    if (error) {
      console.error('❌ 메타데이터 추출 오류:', error);
      return null;
    }

    const metadata: ArticleMetadata = {
      title: result.ogTitle || result.twitterTitle || 'Untitled',
      description: result.ogDescription || result.twitterDescription || null,
      imageUrl:
        result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
    };

    console.log(`✅ 메타데이터 추출 성공: ${metadata.title}`);
    return metadata;
  } catch (error) {
    console.error('❌ 메타데이터 추출 중 예외 발생:', error);
    return null;
  }
}
