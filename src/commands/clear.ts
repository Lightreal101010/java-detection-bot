import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Delete a number of messages')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('How many messages to delete (1-100)')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('amount', true);

    if (!interaction.channel || !interaction.channel.isTextBased() || !('bulkDelete' in interaction.channel)) {
      await interaction.reply({
        content: 'This command can only be used in a text channel.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (amount < 1 || amount > 100) {
      await interaction.reply({
        content: 'Amount must be between 1 and 100.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.channel.bulkDelete(amount, true);
    await interaction.reply({
      content: `🧹 Deleted ${amount} messages.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
