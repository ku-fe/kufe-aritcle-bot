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
  console.log('🔍 포럼 이벤트 핸들러 설정 중...');

  // 스레드 생성 이벤트 리스너
  client.on(Events.ThreadCreate, async (thread) => {
    try {
      console.log(`🔍 새 스레드 감지: ${thread.name} (ID: ${thread.id})`);

      // 포럼 채널 스레드인지 확인
      const parent = thread.parent;
      if (!parent || !(parent instanceof ForumChannel)) {
        console.log('🔍 포럼 채널의 스레드가 아님');
        return;
      }

      // 지정된 포럼 채널인지 확인
      if (parent.id !== FORUM_CHANNEL_ID) {
        console.log(
          `🔍 지정된 포럼 채널이 아님 (${parent.id} !== ${FORUM_CHANNEL_ID})`,
        );
        return;
      }

      console.log('✅ 포럼 스레드 확인됨, 시작 메시지 가져오는 중...');

      // 약간의 지연 후 메시지 가져오기 (Discord API 지연 고려)
      setTimeout(async () => {
        try {
          const messages = await thread.messages.fetch({ limit: 5 });
          console.log(`🔍 가져온 메시지 수: ${messages.size}`);

          if (messages.size === 0) {
            console.log('⚠️ 메시지가 없음, 다시 시도 필요');
            return;
          }

          // 첫 메시지 찾기 (일반적으로 가장 오래된 메시지)
          const starterMessage = messages.last();
          if (!starterMessage) {
            console.log('⚠️ 시작 메시지를 찾을 수 없음');
            return;
          }

          // URL 추출
          const urlMatch = starterMessage.content.match(/https?:\/\/[^\s]+/);
          if (!urlMatch) {
            console.log('⚠️ URL을 찾을 수 없음');
            await starterMessage.reply(
              'URL을 찾을 수 없습니다. 게시물에 공유하려는 URL을 포함해주세요.',
            );
            return;
          }

          const url = urlMatch[0];
          console.log(`🔍 URL 발견: ${url}`);

          // 중복 체크
          const existingArticle = await getArticleByUrl(url);
          if (existingArticle) {
            console.log(`⚠️ 이미 등록된 URL입니다: ${url}`);
            await starterMessage.reply('⚠️ 이미 등록된 아티클입니다!');
            return;
          }

          // 메타데이터 추출
          const metadata = await extractMetadata(url);
          if (!metadata) {
            console.log('⚠️ 메타데이터 추출 실패');
            await starterMessage.reply(
              '❌ 메타데이터를 추출할 수 없습니다. 유효한 URL인지 확인해주세요.',
            );
            return;
          }

          // 포럼 태그를 카테고리로 변환
          console.log(
            `🔍 응용된 태그: ${thread.appliedTags?.join(', ') || '없음'}`,
          );

          // 사용 가능한 모든 태그 로깅
          console.log('🔍 사용 가능한 태그 목록:');
          parent.availableTags.forEach((tag) => {
            console.log(`   - ${tag.id}: ${tag.name}`);
          });

          console.log('🔍 thread 객체 정보:', {
            id: thread.id,
            name: thread.name,
            appliedTagsIds: thread.appliedTags,
            appliedTagsCount: thread.appliedTags?.length || 0,
          });

          // 포럼 태그 이름을 직접 가져와서 카테고리로 사용
          const categories = (thread.appliedTags || [])
            .map((tagId) => {
              const tag = parent.availableTags.find((t) => t.id === tagId);
              if (!tag?.name) {
                console.log(
                  `⚠️ 태그 ID에 해당하는 태그를 찾을 수 없음: ${tagId}`,
                );
                return null;
              }

              // 태그 이름과 이를 정규화한 버전 로깅
              const tagName = tag.name;
              const normalizedTagName = tagName.toLowerCase().trim();
              console.log(
                `🔍 원본 태그 이름: "${tagName}", 정규화됨: "${normalizedTagName}"`,
              );

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
                  console.log(
                    `🔍 부분 매칭 성공: "${normalizedTagName}" -> "${matchingKey}" -> "${category}"`,
                  );
                } else {
                  // 매핑이 없으면 태그 이름 자체를 소문자로 변환하여 카테고리로 사용
                  category = normalizedTagName;
                  console.log(
                    `🔍 매핑 없음, 태그 이름을 카테고리로 사용: "${normalizedTagName}"`,
                  );
                }
              }

              console.log(`🔍 태그 매핑 결과: ${tagName} -> ${category}`);
              return category;
            })
            .filter((category): category is string => category !== null);

          // 변환된 카테고리 목록 로깅
          console.log(
            `🔍 변환된 카테고리 목록: ${categories.join(', ') || '없음'}`,
          );

          // 카테고리가 없으면 기본값 설정
          if (categories.length === 0) {
            categories.push('etc');
            console.log('⚠️ 카테고리가 없어 기본값 "etc"를 추가합니다.');
          }

          // PostgreSQL 배열 타입(_text)과의 호환성을 위해 빈 문자열이나 null 값 제거
          const cleanedCategories = categories
            .filter((category) => category && category.trim() !== '')
            .map((category) => category.trim());

          console.log(
            `🔍 정제된 카테고리 목록: ${cleanedCategories.join(', ')}`,
          );

          // 카테고리 데이터 타입 확인
          console.log('🔍 카테고리 데이터 타입 정보:', {
            categoriesType: typeof categories,
            categoriesIsArray: Array.isArray(categories),
            categoriesLength: categories.length,
            cleanedCategoriesType: typeof cleanedCategories,
            cleanedCategoriesIsArray: Array.isArray(cleanedCategories),
            cleanedCategoriesLength: cleanedCategories.length,
          });

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
          console.error('❌ 메시지 처리 중 오류:', innerError);
        }
      }, 1500); // 1.5초 지연
    } catch (error) {
      console.error('❌ 스레드 처리 중 오류:', error);
    }
  });

  console.log('✅ 포럼 이벤트 핸들러 설정 완료');
}
