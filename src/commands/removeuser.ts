import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
  MessageFlags,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removeuser')
    .setDescription('Remove a user from the current ticket')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to remove').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const channel = interaction.channel;

    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: 'This command only works in a ticket channel.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (
      !channel.name.startsWith('support-') &&
      !channel.name.startsWith('scanner-') &&
      !channel.name.startsWith('partnership-')
    ) {
      await interaction.reply({
        content: 'This is not a valid ticket channel.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await channel.permissionOverwrites.delete(user.id).catch(() => null);

    await interaction.reply({ content: `Removed ${user} from this ticket.` });
  },
};
