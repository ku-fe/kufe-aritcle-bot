import { Client, GatewayIntentBits } from 'discord.js';
import { env } from '../../config/config';

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
    console.log(`Discord client initialized successfully`);
  } catch (error) {
    console.error('Failed to initialize Discord client:', error);
    throw error;
  }
} 