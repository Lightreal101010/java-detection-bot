import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.channel || !('permissionOverwrites' in interaction.channel)) {
      await interaction.reply({
        content: 'This command can only be used in a server channel.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
    });

    await interaction.reply({ content: '🔓 Channel unlocked.' });
  },
};
