import {
  Client,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';

export type SlashCommandName =
  | 'ticketpanel'
  | 'ticket'
  | 'staff'
  | 'ping'
  | 'help';

export function buildCommands() {
  return [
    new SlashCommandBuilder()
      .setName('ticketpanel')
      .setDescription('Send the ticket panel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
      .setName('ticket')
      .setDescription('Ticket tools')
      .addSubcommand((sub) =>
        sub
          .setName('send')
          .setDescription('Send the ticket panel')
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
      .setName('staff')
      .setDescription('Staff information')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check bot latency'),

    new SlashCommandBuilder()
      .setName('help')
      .setDescription('Show bot help'),
  ].map((cmd) => cmd.toJSON());
}

export async function registerCommands(client: Client<true>) {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: buildCommands() },
  );
}
