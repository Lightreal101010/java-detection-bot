import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

const warnings = new Map<string, { moderator: string; reason: string; timestamp: number }[]>();

async function handleWarn(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason', true);

  const list = warnings.get(user.id) || [];
  list.push({
    moderator: interaction.user.tag,
    reason,
    timestamp: Date.now(),
  });
  warnings.set(user.id, list);

  const embed = new EmbedBuilder()
    .setColor(0xff6600)
    .setTitle('User Warned')
    .addFields(
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: interaction.user.tag, inline: true },
      { name: 'Total Warnings', value: `${list.length}`, inline: true },
      { name: 'Reason', value: reason },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export { handleWarn, warnings };

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to warn').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    await handleWarn(interaction);
  },
};
