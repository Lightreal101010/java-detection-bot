import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { CONFIG } from '../config.js';

async function handleStaff(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const guild = interaction.guild;

  if (!guild) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const member = await guild.members.fetch(user.id).catch(() => null);

  if (!member) {
    await interaction.reply({
      content: 'Could not find that user in this server.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const role = guild.roles.cache.get(CONFIG.STAFF_ROLE_ID);

  if (!role) {
    await interaction.reply({
      content: `Staff role not found. Make sure role ID \`${CONFIG.STAFF_ROLE_ID}\` exists.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
    await interaction.reply({
      content: `${user.tag} is already a staff member.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await member.roles.add(role, `Added to staff by ${interaction.user.tag}`);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('Staff Member Added')
    .setDescription(`${user} has been added to the staff team!`)
    .addFields(
      { name: 'Added by', value: `${interaction.user}`, inline: true },
      { name: 'Role', value: role.name, inline: true },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`Welcome to the ${guild.name} Staff Team!`)
      .setDescription('Welcome as staff! You have been granted staff privileges.')
      .addFields(
        { name: 'Server', value: guild.name, inline: true },
        { name: 'Added by', value: interaction.user.tag, inline: true },
      )
      .setThumbnail(guild.iconURL() || '')
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] });
  } catch {
    await interaction.followUp({
      content: `Could not DM ${user.tag}. They may have DMs disabled.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

export { handleStaff };

export default {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Add a user to the staff team')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to add to staff')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction: ChatInputCommandInteraction) {
    await handleStaff(interaction);
  },
};
