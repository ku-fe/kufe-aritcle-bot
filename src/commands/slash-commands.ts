import { SlashCommandBuilder } from 'discord.js';

export const articleCommand = new SlashCommandBuilder()
  .setName('article')
  .setDescription('기술 아티클 제출하기');

export const helpCommand = new SlashCommandBuilder()
  .setName('help')
  .setDescription('도움말 보기');

export const commands = [articleCommand, helpCommand];
