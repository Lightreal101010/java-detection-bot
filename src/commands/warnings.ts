import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { warnings } from './warn.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View a user’s warnings')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to check').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const list = warnings.get(user.id) || [];

    if (list.length === 0) {
      await interaction.reply({
        content: `${user.tag} has no warnings.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const description = list
      .map(
        (w, i) =>
          `**${i + 1}.** ${w.reason}\nModerator: ${w.moderator}\nTime: <t:${Math.floor(w.timestamp / 1000)}:F>`,
      )
      .join('\n\n');

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Warnings for ${user.tag}`)
          .setDescription(description.slice(0, 4000))
          .setTimestamp(),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
