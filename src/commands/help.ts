import { Message, EmbedBuilder } from 'discord.js';
import { botConfig } from '../config/config';

export async function handleHelpCommand(message: Message) {
  const embed = new EmbedBuilder()
    .setTitle('KUFE Article Bot Help')
    .setColor('#0099ff')
    .setDescription('Bot commands for submitting and managing technical articles.')
    .addFields(
      {
        name: `${botConfig.prefix}${botConfig.commands.article} <url>`,
        value: 'Submit a technical article URL. The bot will extract metadata and save it.',
      },
      {
        name: `${botConfig.prefix}${botConfig.commands.help}`,
        value: 'Show this help message.',
      }
    )
    .setFooter({ text: 'KUFE Article Bot' })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
} 