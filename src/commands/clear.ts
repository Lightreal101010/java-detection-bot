import { ChatInputCommandInteraction, TextChannel, EmbedBuilder } from 'discord.js';

export async function handleClear(interaction: ChatInputCommandInteraction) {
  const amount = interaction.options.getInteger('amount', true);
  const channel = interaction.channel;

  if (!channel || !(channel instanceof TextChannel)) {
    return interaction.reply({ content: 'This command can only be used in text channels.', ephemeral: true });
  }

  const deleted = await channel.bulkDelete(amount, true);

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('Messages Cleared')
    .setDescription(`Deleted **${deleted.size}** message(s).`)
    .addFields({ name: 'Moderator', value: `${interaction.user}` })
    .setTimestamp();

  const reply = await interaction.reply({ embeds: [embed], fetchReply: true });
  setTimeout(() => reply.delete().catch(() => {}), 5000);
}
