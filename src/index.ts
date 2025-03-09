import { Events } from 'discord.js';
import { client, initializeDiscordClient } from '@infrastructure/discord/client';
import { initializeSupabaseClient } from '@infrastructure/supabase/client';
import { registerInteractionHandlers } from '@app/events/interaction';

async function bootstrap() {
  try {
    // 외부 서비스 초기화
    await Promise.all([
      initializeDiscordClient(),
      initializeSupabaseClient(),
    ]);

    // 이벤트 핸들러 등록
    registerInteractionHandlers();

    // 봇 준비 완료 시 로그
    client.once(Events.ClientReady, (readyClient) => {
      console.log(`준비 완료! ${readyClient.user.tag}로 로그인됨`);
    });

  } catch (error) {
    console.error('애플리케이션 시작 실패:', error);
    process.exit(1);
  }
}

bootstrap(); 