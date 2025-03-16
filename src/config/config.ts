import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

// Environment variables schema
const envSchema = z.object({
  DISCORD_TOKEN: z.string(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string(),
  COMMAND_PREFIX: z.string().default('!'),
  CLIENT_ID: z.string(),
  FORUM_CHANNEL_ID: z.string(),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Bot configuration
export const botConfig = {
  prefix: env.COMMAND_PREFIX,
  forumChannelId: env.FORUM_CHANNEL_ID,
  commands: {
    article: 'article', // Command to submit an article
    help: 'help', // Command to show help
  },
} as const;
