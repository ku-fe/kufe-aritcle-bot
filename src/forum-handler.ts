import { Client, Events, ForumChannel } from 'discord.js';
import { extractMetadata } from './metadata-service';
import { getArticleByUrl, saveArticle } from './supabase-client';

const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID!;

// 카테고리 매핑 (포럼 태그 -> 카테고리)
const TAG_TO_CATEGORY_MAP: Record<string, string> = {
  frontend: 'web',
  backend: 'web',
  devops: 'web',
  mobile: 'web',
  ai: 'etc',
  blockchain: 'etc',
  security: 'etc',
  architecture: 'framework',
  database: 'library',
  testing: 'library',
  career: 'career',
  other: 'etc',
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
          const categories = (thread.appliedTags || [])
            .map((tagId) => {
              const tag = parent.availableTags.find((t) => t.id === tagId);
              if (!tag?.name) return null;

              const category = TAG_TO_CATEGORY_MAP[tag.name.toLowerCase()];
              console.log(
                `🔍 태그 매핑: ${tag.name} -> ${category || '매칭 없음'}`,
              );
              return category;
            })
            .filter((category): category is string => category !== null);

          // Supabase에 아티클 저장
          await saveArticle({
            title: metadata.title,
            description: metadata.description,
            url,
            image_url: metadata.imageUrl,
            submitted_by: starterMessage.author.id,
            submitted_at: new Date().toISOString(),
            channel_id: thread.id,
            categories,
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
