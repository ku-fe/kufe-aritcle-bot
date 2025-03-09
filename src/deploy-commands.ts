import { REST, Routes } from 'discord.js';
import { env } from './config/config';
import { commands } from './commands/slash-commands';

const rest = new REST().setToken(env.DISCORD_TOKEN);

// Convert commands to JSON
const commandsJson = commands.map(command => command.toJSON());

// Deploy commands
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(env.CLIENT_ID),
      { body: commandsJson }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})(); 