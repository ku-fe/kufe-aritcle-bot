import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleHelpCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('KUFE Article Bot Help')
    .setColor('#0099ff')
    .setDescription('Bot commands for submitting and managing technical articles.')
    .addFields(
      {
        name: `/article <url>`,
        value: 'Submit a technical article URL. The bot will extract metadata and save it.',
      },
      {
        name: `/help`,
        value: 'Show this help message.',
      }
    )
    .setFooter({ text: 'KUFE Article Bot' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
} 