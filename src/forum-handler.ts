import { Client, Events, ForumChannel } from 'discord.js';
import { extractMetadata } from './metadata-service';
import { getArticleByUrl, saveArticle } from './supabase-client';

const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID!;

// 카테고리 매핑 (포럼 태그 -> 카테고리)
const TAG_TO_CATEGORY_MAP: Record<string, string> = {
  // Web 카테고리
  frontend: 'web',
  'front-end': 'web',
  'front end': 'web',
  프론트엔드: 'web',
  backend: 'web',
  'back-end': 'web',
  'back end': 'web',
  백엔드: 'web',
  devops: 'web',
  'dev ops': 'web',
  'dev-ops': 'web',
  데브옵스: 'web',
  웹: 'web',
  web: 'web',
  mobile: 'web',
  모바일: 'web',

  // Etc 카테고리
  ai: 'etc',
  'a.i.': 'etc',
  'artificial intelligence': 'etc',
  인공지능: 'etc',
  blockchain: 'etc',
  블록체인: 'etc',
  security: 'etc',
  보안: 'etc',
  기타: 'etc',
  etc: 'etc',
  other: 'etc',

  // Framework 카테고리
  architecture: 'framework',
  아키텍처: 'framework',
  framework: 'framework',
  프레임워크: 'framework',

  // Library 카테고리
  database: 'library',
  db: 'library',
  데이터베이스: 'library',
  testing: 'library',
  test: 'library',
  테스트: 'library',
  library: 'library',
  라이브러리: 'library',

  // Career 카테고리
  career: 'career',
  커리어: 'career',
  취업: 'career',
  job: 'career',
  면접: 'career',
  interview: 'career',
};

// 포럼 스레드 이벤트 핸들러 설정
export function setupForumHandler(client: Client) {
  // 스레드 생성 이벤트 리스너
  client.on(Events.ThreadCreate, async (thread) => {
    try {
      // 포럼 채널 스레드인지 확인
      const parent = thread.parent;
      if (!parent || !(parent instanceof ForumChannel)) {
        return;
      }

      // 지정된 포럼 채널인지 확인
      if (parent.id !== FORUM_CHANNEL_ID) {
        return;
      }

      // 약간의 지연 후 메시지 가져오기 (Discord API 지연 고려)
      setTimeout(async () => {
        try {
          const messages = await thread.messages.fetch({ limit: 5 });

          if (messages.size === 0) {
            return;
          }

          // 첫 메시지 찾기 (일반적으로 가장 오래된 메시지)
          const starterMessage = messages.last();
          if (!starterMessage) {
            return;
          }

          // URL 추출
          const urlMatch = starterMessage.content.match(/https?:\/\/[^\s]+/);
          if (!urlMatch) {
            await starterMessage.reply(
              'URL을 찾을 수 없습니다. 게시물에 공유하려는 URL을 포함해주세요.',
            );
            return;
          }

          const url = urlMatch[0];

          // 중복 체크
          const existingArticle = await getArticleByUrl(url);
          if (existingArticle) {
            await starterMessage.reply('⚠️ 이미 등록된 아티클입니다!');
            return;
          }

          // 메타데이터 추출
          const metadata = await extractMetadata(url);
          if (!metadata) {
            await starterMessage.reply(
              '❌ 메타데이터를 추출할 수 없습니다. 유효한 URL인지 확인해주세요.',
            );
            return;
          }

          // 포럼 태그 이름을 직접 가져와서 카테고리로 사용
          const categories = (thread.appliedTags || [])
            .map((tagId) => {
              const tag = parent.availableTags.find((t) => t.id === tagId);
              if (!tag?.name) {
                return null;
              }

              // 태그 이름과 이를 정규화한 버전
              const tagName = tag.name;
              const normalizedTagName = tagName.toLowerCase().trim();

              // 1. 기존 매핑 테이블에서 태그 이름 확인 (폴백 메커니즘)
              let category = TAG_TO_CATEGORY_MAP[normalizedTagName];

              // 2. 매핑이 없으면 태그 이름 자체를 카테고리로 사용
              if (!category) {
                // 기존 부분 매칭 시도
                const matchingKey = Object.keys(TAG_TO_CATEGORY_MAP).find(
                  (key) =>
                    normalizedTagName.includes(key) ||
                    key.includes(normalizedTagName),
                );

                if (matchingKey) {
                  category = TAG_TO_CATEGORY_MAP[matchingKey];
                } else {
                  // 매핑이 없으면 태그 이름 자체를 소문자로 변환하여 카테고리로 사용
                  category = normalizedTagName;
                }
              }

              return category;
            })
            .filter((category): category is string => category !== null);

          // 카테고리가 없으면 기본값 설정
          if (categories.length === 0) {
            categories.push('etc');
          }

          // PostgreSQL 배열 타입(_text)과의 호환성을 위해 빈 문자열이나 null 값 제거
          const cleanedCategories = categories
            .filter((category) => category && category.trim() !== '')
            .map((category) => category.trim());

          // Supabase에 아티클 저장
          await saveArticle({
            title: metadata.title,
            description: metadata.description,
            url,
            image_url: metadata.imageUrl,
            submitted_by: starterMessage.author.id,
            submitted_at: new Date().toISOString(),
            channel_id: thread.id,
            categories: cleanedCategories,
          });

          // 성공 메시지 전송
          await starterMessage.reply({
            content: '✅ 아티클이 성공적으로 저장되었습니다!',
          });
        } catch (innerError) {
          console.error('메시지 처리 중 오류:', innerError);
        }
      }, 1500); // 1.5초 지연
    } catch (error) {
      console.error('스레드 처리 중 오류:', error);
    }
  });
}
