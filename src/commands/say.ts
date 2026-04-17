import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot send a message')
    .addStringOption((option) =>
      option.setName('message').setDescription('Message text').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString('message', true);

    if (!interaction.channel || !interaction.channel.isSendable()) {
      await interaction.reply({
        content: 'This channel is not sendable.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.channel.send({ content: message });
    await interaction.reply({
      content: 'Message sent.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
