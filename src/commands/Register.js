import {
  Client,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';

export async function registerCommands(client: Client<true>) {
  const commands = [
    new SlashCommandBuilder()
      .setName('ticketpanel')
      .setDescription('Sends the ticket panel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
      .setName('staff')
      .setDescription('Staff command'),

    new SlashCommandBuilder()
      .setName('ticket')
      .setDescription('Ticket command'),
  ].map((cmd) => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands },
  );
}
