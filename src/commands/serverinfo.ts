import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleServerInfo(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'Server only.', ephemeral: true });

  await guild.members.fetch();

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(guild.name)
    .setThumbnail(guild.iconURL({ size: 256 }) || '')
    .addFields(
      { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
      { name: 'Members', value: `${guild.memberCount}`, inline: true },
      { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
      { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
      { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
      { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Verification Level', value: guild.verificationLevel.toString(), inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
