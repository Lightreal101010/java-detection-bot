import {
  Client,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';

const TEST_GUILD_ID = process.env.TEST_GUILD_ID || '';

export async function registerCommands(client: Client<true>) {
  const commands = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Show bot latency'),

    new SlashCommandBuilder()
      .setName('ticketpanel')
      .setDescription('Send the ticket panel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
      .setName('help')
      .setDescription('Show help'),

    new SlashCommandBuilder()
      .setName('staff')
      .setDescription('Show staff information'),

    new SlashCommandBuilder()
      .setName('ticket')
      .setDescription('Ticket tools')
      .addSubcommand((sub) =>
        sub.setName('send').setDescription('Send the ticket panel'),
      ),
  ].map((cmd) => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

  if (TEST_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, TEST_GUILD_ID),
      { body: commands },
    );
    console.log(`Registered ${commands.length} guild commands`);
    return;
  }

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands },
  );

  console.log(`Registered ${commands.length} global commands`);
}
