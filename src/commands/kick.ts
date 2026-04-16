import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';

async function handleKick(interaction: ChatInputCommandInteraction) {
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

  if (!member) {
    await interaction.reply({
      content: 'That user is not in this server.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!member.kickable) {
    await interaction.reply({
      content: 'I cannot kick this user.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await user.send(`You have been kicked from **${guild.name}**.\nReason: ${reason}`).catch(() => {});
    await member.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle('User Kicked')
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Reason', value: reason },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch {
    await interaction.reply({
      content: `Failed to kick ${user.tag}.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

export { handleKick };

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to kick').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    await handleKick(interaction);
  },
};
