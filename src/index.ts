import { Client, Events, GatewayIntentBits } from 'discord.js';
import { env, botConfig } from './config/config';
import { handleArticleCommand } from './commands/article';
import { handleHelpCommand } from './commands/help';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if message starts with prefix
  if (!message.content.startsWith(botConfig.prefix)) return;

  // Parse command and arguments
  const args = message.content.slice(botConfig.prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  // Handle commands
  switch (command) {
    case botConfig.commands.article:
      await handleArticleCommand(message, args);
      break;
    case botConfig.commands.help:
      await handleHelpCommand(message);
      break;
    default:
      await message.reply('Unknown command. Use !help to see available commands.');
  }
});

// Login to Discord
client.login(env.DISCORD_TOKEN); 