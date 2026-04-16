import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';

async function handleBan(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const guild = interaction.guild;

  if (!guild) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const member = await guild.members.fetch(user.id).catch(() => null);

  if (member && !member.bannable) {
    await interaction.reply({
      content: 'I cannot ban this user. They may have a higher role.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await user.send(`You have been banned from **${guild.name}**.\nReason: ${reason}`).catch(() => {});
    await guild.members.ban(user.id, { reason, deleteMessageSeconds: 604800 });

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('User Banned')
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user}`, inline: true },
        { name: 'Reason', value: reason },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch {
    await interaction.reply({
      content: `Failed to ban ${user.tag}.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

export { handleBan };

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to ban')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    await handleBan(interaction);
  },
};
