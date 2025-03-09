import { Events } from 'discord.js';
import { client, initializeDiscordClient } from './infrastructure/discord/client';
import { initializeSupabaseClient } from './infrastructure/supabase/client';
import { registerInteractionHandlers } from './app/events/interaction';

async function bootstrap() {
  try {
    // Initialize external services
    await Promise.all([
      initializeDiscordClient(),
      initializeSupabaseClient(),
    ]);

    // Register event handlers
    registerInteractionHandlers();

    // Log when bot is ready
    client.once(Events.ClientReady, (readyClient) => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    });

  } catch (error) {
    console.error('Failed to start the application:', error);
    process.exit(1);
  }
}

bootstrap(); 