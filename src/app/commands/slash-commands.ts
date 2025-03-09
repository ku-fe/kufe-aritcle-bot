import { SlashCommandBuilder } from 'discord.js';
import { ARTICLE_CATEGORIES } from '../../services/category/types';

// Convert ARTICLE_CATEGORIES to choices array
const categoryChoices = Object.values(ARTICLE_CATEGORIES).map(category => ({
  name: `${category.label} - ${category.description}`,
  value: category.value
}));

export const articleCommand = new SlashCommandBuilder()
  .setName('article')
  .setDescription('Submit a technical article URL')
  .addStringOption(option =>
    option
      .setName('url')
      .setDescription('The URL of the article to submit')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('category1')
      .setDescription('First category (required)')
      .setRequired(true)
      .addChoices(...categoryChoices)
  )
  .addStringOption(option =>
    option
      .setName('category2')
      .setDescription('Second category (optional)')
      .setRequired(false)
      .addChoices(...categoryChoices)
  )
  .addStringOption(option =>
    option
      .setName('category3')
      .setDescription('Third category (optional)')
      .setRequired(false)
      .addChoices(...categoryChoices)
  );

export const helpCommand = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show help information');

export const commands = [articleCommand, helpCommand]; 