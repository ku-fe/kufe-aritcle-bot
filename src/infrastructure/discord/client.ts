import { env } from '@/config/config';
import { Client, GatewayIntentBits } from 'discord.js';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// 재연결 로직 추가
client.on('disconnect', () => {
  console.log('디스코드 클라이언트 연결이 끊겼습니다. 재연결을 시도합니다...');
});

client.on('error', (error) => {
  console.error('디스코드 클라이언트 에러:', error);
});

export async function initializeDiscordClient(): Promise<void> {
  try {
    await client.login(env.DISCORD_TOKEN);
    console.log('디스코드 클라이언트가 성공적으로 초기화되었습니다');

    // 주기적인 연결 상태 확인
    setInterval(() => {
      if (!client.isReady()) {
        console.log('클라이언트가 준비되지 않았습니다. 재연결을 시도합니다...');
        client.login(env.DISCORD_TOKEN).catch(console.error);
      }
    }, 30000); // 30초마다 확인
  } catch (error) {
    console.error('디스코드 클라이언트 초기화 실패:', error);
    throw error;
  }
}
