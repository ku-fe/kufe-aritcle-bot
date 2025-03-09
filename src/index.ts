import { Client, Events, GatewayIntentBits } from 'discord.js';
import { env } from './config/config';
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

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'article': {
        const url = interaction.options.getString('url', true);
        await handleArticleCommand(interaction, [url]);
        break;
      }
      case 'help':
        await handleHelpCommand(interaction);
        break;
      default:
        await interaction.reply('Unknown command. Use /help to see available commands.');
    }
  } catch (error) {
    console.error('Error handling command:', error);
    const errorMessage = 'An error occurred while processing your command.';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Login to Discord
client.login(env.DISCORD_TOKEN); 