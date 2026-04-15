import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleUserInfo(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user') || interaction.user;
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'Server only.', ephemeral: true });

  const member = await guild.members.fetch(user.id).catch(() => null);

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('User Information')
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: 'Username', value: user.tag, inline: true },
      { name: 'ID', value: user.id, inline: true },
      { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
    );

  if (member) {
    embed.addFields(
      { name: 'Joined Server', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown', inline: true },
      { name: 'Roles', value: member.roles.cache.filter(r => r.id !== guild.id).map(r => `${r}`).join(', ') || 'None', inline: false },
      { name: 'Highest Role', value: `${member.roles.highest}`, inline: true }
    );
  }

  embed.setTimestamp();
  await interaction.reply({ embeds: [embed] });
}
