import { deployCommands } from './app/commands/deploy';

deployCommands().catch(error => {
  console.error('Failed to deploy commands:', error);
  process.exit(1);
}); 