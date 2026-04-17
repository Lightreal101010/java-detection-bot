import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
  MessageFlags,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('adduser')
    .setDescription('Add a user to the current ticket')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to add').setRequired(true),
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

    await channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
    });

    await interaction.reply({ content: `Added ${user} to this ticket.` });
  },
};
