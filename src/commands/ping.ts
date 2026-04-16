import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Show bot latency'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      content: `Pong! ${interaction.client.ws.ping}ms`,
      ephemeral: true,
    });
  },
};
