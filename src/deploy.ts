import { deployCommands } from '@/commands/deploy';

deployCommands().catch((error: unknown) => {
  console.error('Failed to deploy commands:', error);
  process.exit(1);
});
