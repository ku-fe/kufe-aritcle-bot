import { Events, Interaction } from 'discord.js';
import { handleArticleCommand } from '../commands/article';
import { handleHelpCommand } from '../commands/help';
import { client } from '../../infrastructure/discord/client';

export function registerInteractionHandlers(): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
      switch (commandName) {
        case 'article':
          await handleArticleCommand(interaction);
          break;
        case 'help':
          await handleHelpCommand(interaction);
          break;
        default:
          await interaction.reply({
            content: 'Unknown command. Use /help to see available commands.',
            ephemeral: true,
          });
      }
    } catch (error) {
      console.error('Error handling interaction:', error);
      const errorMessage = 'An error occurred while processing your command.';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: errorMessage,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        });
      }
    }
  });
} 