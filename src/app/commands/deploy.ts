import { REST, Routes } from 'discord.js';
import { env } from '../../config/config';
import { commands } from './slash-commands';

export async function deployCommands(): Promise<void> {
  const rest = new REST().setToken(env.DISCORD_TOKEN);
  const commandsJson = commands.map(command => command.toJSON());

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(env.CLIENT_ID),
      { body: commandsJson }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Failed to deploy commands:', error);
    throw error;
  }
} 