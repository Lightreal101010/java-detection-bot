import { Client, REST, Routes } from 'discord.js';
import { loadSlashCommands } from './registry.js';

const TEST_GUILD_ID = process.env.TEST_GUILD_ID || '';

export async function registerCommands(client: Client<true>) {
  const { json } = await loadSlashCommands();

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

  if (TEST_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, TEST_GUILD_ID),
      { body: json },
    );
    console.log(`Registered ${json.length} guild commands`);
    return;
  }

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: json },
  );
  console.log(`Registered ${json.length} global commands`);
}
