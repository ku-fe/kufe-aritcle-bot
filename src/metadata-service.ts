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
    const options = {
      url,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 10000, // 10초 타임아웃
      downloadLimit: 1000000, // 다운로드 제한 1MB
    };

    const { result, error } = await ogs(options);

    if (error) {
      console.error('메타데이터 추출 오류:', error);
      return null;
    }

    const metadata: ArticleMetadata = {
      title: result.ogTitle || result.twitterTitle || 'Untitled',
      description: result.ogDescription || result.twitterDescription || null,
      imageUrl:
        result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
    };

    return metadata;
  } catch (error) {
    console.error('메타데이터 추출 중 예외 발생:', error);
    return null;
  }
}
