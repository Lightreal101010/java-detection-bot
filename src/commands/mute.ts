import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleMute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const duration = interaction.options.getInteger('duration', true);
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
  if (!member.moderatable) return interaction.reply({ content: 'I cannot mute this user.', ephemeral: true });

  const ms = duration * 60 * 1000;
  await member.timeout(ms, reason);

  const embed = new EmbedBuilder()
    .setColor(0xffaa00)
    .setTitle('User Muted')
    .addFields(
      { name: 'User', value: `${user.tag}`, inline: true },
      { name: 'Duration', value: `${duration} minutes`, inline: true },
      { name: 'Moderator', value: `${interaction.user}`, inline: true },
      { name: 'Reason', value: reason }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleUnmute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });

  await member.timeout(null);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('User Unmuted')
    .setDescription(`${user.tag} has been unmuted.`)
    .addFields({ name: 'Moderator', value: `${interaction.user}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
