import { client } from '@/infrastructure/discord/client';
import type { Interaction } from 'discord.js';
import { Events, MessageFlags } from 'discord.js';
import {
  handleArticleCommand,
  handleArticleModalSubmit,
} from '../commands/article';
import { handleHelpCommand } from '../commands/help';

export function registerInteractionHandlers(): void {
  client.on(Events.InteractionCreate, (interaction: Interaction) => {
    (async () => {
      try {
        if (interaction.isChatInputCommand()) {
          const { commandName } = interaction;

          switch (commandName) {
            case 'article':
              await handleArticleCommand(interaction);
              break;
            case 'help':
              await handleHelpCommand(interaction);
              break;
            default:
              await interaction.reply({
                content:
                  '알 수 없는 명령어입니다. /help를 입력하여 사용 가능한 명령어를 확인하세요.',
                flags: MessageFlags.Ephemeral,
              });
          }
        } else if (interaction.isModalSubmit()) {
          if (interaction.customId.startsWith('article-')) {
            await handleArticleModalSubmit(interaction);
          }
        }
      } catch (error) {
        console.error('상호작용 처리 중 오류 발생:', error);
        const errorMessage = '명령어를 처리하는 중에 오류가 발생했습니다.';

        if (interaction.isRepliable()) {
          if ('deferred' in interaction && interaction.deferred) {
            await interaction.editReply({ content: errorMessage });
          } else {
            await interaction.reply({
              content: errorMessage,
              flags: MessageFlags.Ephemeral,
            });
          }
        }
      }
    })().catch((error: unknown) => {
      console.error('Unhandled error in interaction handler:', error);
    });
  });
}
