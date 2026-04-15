import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleBan(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (member && !member.bannable) {
    return interaction.reply({ content: 'I cannot ban this user. They may have a higher role.', ephemeral: true });
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
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    await interaction.reply({ content: `Failed to ban ${user.tag}.`, ephemeral: true });
  }
}
