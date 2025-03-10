import { commands } from '@/commands/slash-commands';
import { env } from '@/config/config';
import { REST, Routes } from 'discord.js';

export async function deployCommands(): Promise<void> {
  const rest = new REST().setToken(env.DISCORD_TOKEN);
  const commandsJson = commands.map((command) => command.toJSON());

  try {
    console.log('슬래시 명령어 새로고침을 시작합니다.');

    await rest.put(Routes.applicationCommands(env.CLIENT_ID), {
      body: commandsJson,
    });

    console.log('슬래시 명령어가 성공적으로 새로고침되었습니다.');
  } catch (error) {
    console.error('명령어 배포 실패:', error);
    throw error;
  }
}
