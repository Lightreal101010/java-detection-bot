import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleScan(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'Server only.', ephemeral: true });

  await interaction.deferReply();

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.editReply('User not found in this server.');

  const flags: string[] = [];
  const accountAge = Date.now() - user.createdTimestamp;
  const daysSinceCreation = Math.floor(accountAge / (1000 * 60 * 60 * 24));

  if (daysSinceCreation < 7) flags.push('New account (less than 7 days old)');
  if (daysSinceCreation < 30) flags.push('Account younger than 30 days');
  if (!user.avatarURL()) flags.push('No avatar set');
  if (member.roles.cache.size <= 1) flags.push('No roles assigned');

  const joinedAt = member.joinedAt;
  if (joinedAt) {
    const daysSinceJoin = Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceJoin < 1) flags.push('Joined less than 24 hours ago');
  }

  if (member.communicationDisabledUntil && member.communicationDisabledUntil > new Date()) {
    flags.push('Currently timed out');
  }

  const riskLevel = flags.length >= 3 ? 'HIGH' : flags.length >= 1 ? 'MEDIUM' : 'LOW';
  const riskColor = riskLevel === 'HIGH' ? 0xff0000 : riskLevel === 'MEDIUM' ? 0xffaa00 : 0x00ff00;

  const embed = new EmbedBuilder()
    .setColor(riskColor)
    .setTitle(`Scan Results: ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ size: 128 }))
    .addFields(
      { name: 'Risk Level', value: `**${riskLevel}**`, inline: true },
      { name: 'Account Age', value: `${daysSinceCreation} days`, inline: true },
      { name: 'Flags Found', value: `${flags.length}`, inline: true },
      { name: 'Flags', value: flags.length > 0 ? flags.map(f => `- ${f}`).join('\n') : 'No suspicious flags detected.' }
    )
    .setFooter({ text: `Scanned by ${interaction.user.tag}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
