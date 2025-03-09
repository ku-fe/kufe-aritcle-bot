import { SlashCommandBuilder } from 'discord.js';

export const articleCommand = new SlashCommandBuilder()
  .setName('article')
  .setDescription('Submit a technical article URL')
  .addStringOption(option =>
    option
      .setName('url')
      .setDescription('The URL of the article to submit')
      .setRequired(true)
  );

export const helpCommand = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show available commands and their usage');

export const commands = [articleCommand, helpCommand]; 