import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleAnnounce(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString('title', true);
  const message = interaction.options.getString('message', true);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title)
    .setDescription(message)
    .setFooter({ text: `Announced by ${interaction.user.tag}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
