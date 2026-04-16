import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';

async function handleMute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const minutes = interaction.options.getInteger('minutes', true);
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

  if (!member.moderatable) {
    await interaction.reply({
      content: 'I cannot timeout this user.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const durationMs = minutes * 60 * 1000;

  try {
    await member.timeout(durationMs, reason);

    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle('User Muted')
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Duration', value: `${minutes} minute(s)`, inline: true },
        { name: 'Reason', value: reason },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch {
    await interaction.reply({
      content: `Failed to mute ${user.tag}.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

export { handleMute };

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a user')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to mute').setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('minutes').setDescription('Duration in minutes').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    await handleMute(interaction);
  },
};
