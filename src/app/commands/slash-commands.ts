import { SlashCommandBuilder } from 'discord.js';
import { ARTICLE_CATEGORIES } from '@services/category/types';

// 카테고리 선택지 배열 생성
const categoryChoices = Object.values(ARTICLE_CATEGORIES).map(category => ({
  name: `${category.label} - ${category.description}`,
  value: category.value
}));

export const articleCommand = new SlashCommandBuilder()
  .setName('article')
  .setDescription('기술 아티클 URL 제출하기')
  .addStringOption(option =>
    option
      .setName('url')
      .setDescription('제출할 아티클의 URL')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('category1')
      .setDescription('첫 번째 카테고리 (필수)')
      .setRequired(true)
      .addChoices(...categoryChoices)
  )
  .addStringOption(option =>
    option
      .setName('category2')
      .setDescription('두 번째 카테고리 (선택)')
      .setRequired(false)
      .addChoices(...categoryChoices)
  )
  .addStringOption(option =>
    option
      .setName('category3')
      .setDescription('세 번째 카테고리 (선택)')
      .setRequired(false)
      .addChoices(...categoryChoices)
  );

export const helpCommand = new SlashCommandBuilder()
  .setName('help')
  .setDescription('도움말 보기');

export const commands = [articleCommand, helpCommand]; 