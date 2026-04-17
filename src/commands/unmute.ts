import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove a timeout from a user')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to unmute').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const member = await guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      await interaction.reply({
        content: 'That user is not in this server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!member.moderatable) {
      await interaction.reply({
        content: 'I cannot remove the timeout from this user.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await member.timeout(null);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🔊 User Unmuted')
          .addFields(
            { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
            { name: 'Moderator', value: interaction.user.tag, inline: true },
          )
          .setTimestamp(),
      ],
    });
  },
};
