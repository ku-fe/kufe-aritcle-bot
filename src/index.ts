import { Client, Events, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import http from 'http';
import { setupForumHandler } from './forum-handler';
import { createSupabaseClient } from './supabase-client';

// 환경 변수 확인
const requiredEnvVars = [
  'DISCORD_TOKEN',
  'FORUM_CHANNEL_ID',
  'SUPABASE_URL',
  'SUPABASE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in the environment variables`);
    process.exit(1);
  }
}

// HTTP 서버 생성 (Render.com 웹 서비스용)
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Discord Bot is running');
});

// Discord 클라이언트 초기화
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// 클라이언트 시작 및 초기화
async function startBot() {
  try {
    // Supabase 클라이언트 초기화
    await createSupabaseClient();

    // 포럼 핸들러 설정
    setupForumHandler(client);

    // 봇 로그인
    await client.login(process.env.DISCORD_TOKEN);

    client.once(Events.ClientReady, (readyClient) => {
      console.log(`✅ 봇이 준비되었습니다: ${readyClient.user.tag}`);
      console.log(`✅ 포럼 채널 ID: ${process.env.FORUM_CHANNEL_ID}`);
    });

    // 에러 처리
    client.on(Events.Error, (error) => {
      console.error('Discord 클라이언트 에러:', error);
    });

    // HTTP 서버 시작
    server.listen(PORT, () => {
      console.log(`HTTP 서버가 포트 ${PORT}에서 실행 중입니다`);
    });
  } catch (error) {
    console.error('봇 시작 중 오류 발생:', error);
    process.exit(1);
  }
}

// 봇 시작
startBot();
