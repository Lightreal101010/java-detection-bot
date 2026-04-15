import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

const warnings = new Map<string, { reason: string; moderator: string; date: Date }[]>();

function getKey(guildId: string, userId: string) {
  return `${guildId}-${userId}`;
}

export async function handleWarn(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason', true);
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'Server only.', ephemeral: true });

  const key = getKey(guild.id, user.id);
  const userWarnings = warnings.get(key) || [];
  userWarnings.push({ reason, moderator: interaction.user.tag, date: new Date() });
  warnings.set(key, userWarnings);

  const embed = new EmbedBuilder()
    .setColor(0xffcc00)
    .setTitle('User Warned')
    .addFields(
      { name: 'User', value: `${user.tag}`, inline: true },
      { name: 'Warning #', value: `${userWarnings.length}`, inline: true },
      { name: 'Moderator', value: `${interaction.user}`, inline: true },
      { name: 'Reason', value: reason }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  try {
    await user.send(`You have been warned in **${guild.name}**.\nReason: ${reason}\nTotal warnings: ${userWarnings.length}`);
  } catch {}
}

export async function handleWarnings(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'Server only.', ephemeral: true });

  const key = getKey(guild.id, user.id);
  const userWarnings = warnings.get(key) || [];

  if (userWarnings.length === 0) {
    return interaction.reply({ content: `${user.tag} has no warnings.`, ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor(0xffcc00)
    .setTitle(`Warnings for ${user.tag}`)
    .setDescription(
      userWarnings
        .map((w, i) => `**#${i + 1}** — ${w.reason}\nBy: ${w.moderator} | ${w.date.toLocaleDateString()}`)
        .join('\n\n')
    )
    .setFooter({ text: `Total: ${userWarnings.length} warning(s)` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleClearWarnings(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'Server only.', ephemeral: true });

  const key = getKey(guild.id, user.id);
  warnings.delete(key);

  await interaction.reply({ content: `All warnings cleared for ${user.tag}.` });
}
