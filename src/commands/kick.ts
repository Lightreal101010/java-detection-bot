import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleKick(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
  if (!member.kickable) return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });

  try {
    await user.send(`You have been kicked from **${guild.name}**.\nReason: ${reason}`).catch(() => {});
    await member.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle('User Kicked')
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user}`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch {
    await interaction.reply({ content: `Failed to kick ${user.tag}.`, ephemeral: true });
  }
}
