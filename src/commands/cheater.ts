import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const cheaterLog: {
  id: string;
  tag: string;
  reason: string;
  flaggedBy: string;
  date: Date;
}[] = [];

export async function handleCheater(interaction: ChatInputCommandInteraction) {
  const userId = interaction.options.getString('userid', true).trim();
  const reason = interaction.options.getString('reason', true);

  if (!/^\d{17,20}$/.test(userId)) {
    return interaction.reply({ content: 'Invalid Discord user ID. Must be 17-20 digits.', ephemeral: true });
  }

  let tag = userId;
  try {
    const user = await interaction.client.users.fetch(userId);
    tag = user.tag;
  } catch {
    tag = `Unknown User (${userId})`;
  }

  cheaterLog.push({
    id: userId,
    tag,
    reason,
    flaggedBy: interaction.user.tag,
    date: new Date(),
  });

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('⚠️ Cheater Flagged')
    .addFields(
      { name: 'User', value: `${tag}`, inline: true },
      { name: 'Discord ID', value: userId, inline: true },
      { name: 'Flagged by', value: interaction.user.tag, inline: true },
      { name: 'Reason', value: reason },
    )
    .setFooter({ text: `Total flagged users: ${cheaterLog.length}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleCheaterLog(interaction: ChatInputCommandInteraction) {
  if (cheaterLog.length === 0) {
    return interaction.reply({ content: 'No cheaters have been flagged yet.', ephemeral: true });
  }

  const entries = cheaterLog
    .slice(-20)
    .reverse()
    .map((c, i) =>
      `**${i + 1}.** ${c.tag} \`${c.id}\`\nReason: ${c.reason} | By: ${c.flaggedBy} | ${c.date.toLocaleDateString()}`
    )
    .join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('🚨 Cheater Log')
    .setDescription(entries)
    .setFooter({ text: `Total: ${cheaterLog.length} flagged user(s). Showing last 20.` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
