import { registerInteractionHandlers } from '@/events/interaction';
import {
  client,
  initializeDiscordClient,
} from '@/infrastructure/discord/client';
import { initializeSupabaseClient } from '@/infrastructure/supabase/client';
import { Events } from 'discord.js';
import * as http from 'http';

// HTTP 서버 생성
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        discordStatus: client.isReady() ? 'connected' : 'disconnected',
      }),
    );
    return;
  }
  res.writeHead(404);
  res.end();
});

async function bootstrap() {
  try {
    // HTTP 서버 시작
    server.listen(process.env.PORT || 3000, () => {
      console.log(
        `HTTP 서버가 포트 ${String(process.env.PORT || 3000)}에서 시작되었습니다`,
      );
    });

    // 외부 서비스 초기화
    await Promise.all([initializeDiscordClient(), initializeSupabaseClient()]);

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

void bootstrap();
