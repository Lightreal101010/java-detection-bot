import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

async function handleHelp(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Trace Bot — Commands')
    .addFields(
      {
        name: 'Moderation',
        value: [
          '`/ban` — Ban a user',
          '`/kick` — Kick a user',
          '`/mute` — Timeout a user',
          '`/warn` — Warn a user',
          '`/announce` — Send an announcement',
        ].join('\n'),
      },
      {
        name: 'Tickets',
        value: [
          '`/ticket` — Open a private ticket',
          '`/ticketpanel` — Send the ticket panel',
        ].join('\n'),
      },
      {
        name: 'Utility',
        value: [
          '`/ping` — Show bot latency',
          '`/help` — Show this help menu',
          '`/staff` — Add a user to staff',
        ].join('\n'),
      },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export { handleHelp };

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show the help menu'),

  async execute(interaction: ChatInputCommandInteraction) {
    await handleHelp(interaction);
  },
};
