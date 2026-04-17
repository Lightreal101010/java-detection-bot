import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reportpanel')
    .setDescription('Send a report panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.channel || !interaction.channel.isSendable()) {
      await interaction.reply({
        content: 'This channel is not sendable.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🚨 Report a User')
      .setDescription('Click the button below to contact staff about a report.');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('open_report_ticket')
        .setLabel('Open Report Ticket')
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({
      content: 'Report panel sent.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
