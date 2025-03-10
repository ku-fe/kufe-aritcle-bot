import { type ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleHelpCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('KUFE 아티클 봇 도움말')
    .setColor('#0099ff')
    .setDescription('기술 아티클을 제출하고 관리하기 위한 봇 명령어입니다.')
    .addFields(
      {
        name: `/article <url>`,
        value:
          '기술 아티클 URL을 제출합니다. 봇이 메타데이터를 추출하여 저장합니다.',
      },
      {
        name: `/help`,
        value: '이 도움말 메시지를 표시합니다.',
      },
    )
    .setFooter({ text: 'KUFE 아티클 봇' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
