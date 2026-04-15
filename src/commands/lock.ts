import { ChatInputCommandInteraction, TextChannel, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export async function handleLock(interaction: ChatInputCommandInteraction) {
  const channel = interaction.channel;
  if (!channel || !(channel instanceof TextChannel)) {
    return interaction.reply({ content: 'Text channels only.', ephemeral: true });
  }

  await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
    SendMessages: false,
  });

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('Channel Locked')
    .setDescription(`${channel} has been locked.`)
    .addFields({ name: 'Moderator', value: `${interaction.user}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleUnlock(interaction: ChatInputCommandInteraction) {
  const channel = interaction.channel;
  if (!channel || !(channel instanceof TextChannel)) {
    return interaction.reply({ content: 'Text channels only.', ephemeral: true });
  }

  await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
    SendMessages: null,
  });

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('Channel Unlocked')
    .setDescription(`${channel} has been unlocked.`)
    .addFields({ name: 'Moderator', value: `${interaction.user}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
