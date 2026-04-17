import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for the current channel')
    .addIntegerOption((option) =>
      option.setName('seconds').setDescription('Slowmode in seconds').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getInteger('seconds', true);

    if (!interaction.channel || !('setRateLimitPerUser' in interaction.channel)) {
      await interaction.reply({
        content: 'This channel does not support slowmode.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.channel.setRateLimitPerUser(seconds);
    await interaction.reply({ content: `🐢 Slowmode set to ${seconds} second(s).` });
  },
};
