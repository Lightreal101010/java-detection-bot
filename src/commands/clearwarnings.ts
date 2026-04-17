import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { warnings } from './warn.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Clear all warnings for a user')
    .addUserOption((option) =>
      option.setName('user').setDescription('User').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);

    warnings.delete(user.id);

    await interaction.reply({
      content: `Cleared all warnings for ${user.tag}.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
