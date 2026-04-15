import { ChatInputCommandInteraction, TextChannel, EmbedBuilder } from 'discord.js';

export async function handleSlowmode(interaction: ChatInputCommandInteraction) {
  const seconds = interaction.options.getInteger('seconds', true);
  const channel = interaction.channel;

  if (!channel || !(channel instanceof TextChannel)) {
    return interaction.reply({ content: 'This command can only be used in text channels.', ephemeral: true });
  }

  await channel.setRateLimitPerUser(seconds);

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('Slowmode Updated')
    .setDescription(seconds === 0 ? 'Slowmode has been disabled.' : `Slowmode set to **${seconds}** seconds.`)
    .addFields({ name: 'Moderator', value: `${interaction.user}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
