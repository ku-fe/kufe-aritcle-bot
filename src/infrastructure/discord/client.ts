import { Client, GatewayIntentBits } from 'discord.js';
import { env } from '@config/config';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

export async function initializeDiscordClient(): Promise<void> {
  try {
    await client.login(env.DISCORD_TOKEN);
    console.log('디스코드 클라이언트가 성공적으로 초기화되었습니다');
  } catch (error) {
    console.error('디스코드 클라이언트 초기화 실패:', error);
    throw error;
  }
} 