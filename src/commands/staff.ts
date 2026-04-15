import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CONFIG } from '../config.js';

export async function handleStaff(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply({ content: 'Could not find that user in this server.', ephemeral: true });

  const role = guild.roles.cache.get(CONFIG.STAFF_ROLE_ID);
  if (!role) return interaction.reply({ content: `Staff role not found. Make sure role ID \`${CONFIG.STAFF_ROLE_ID}\` exists.`, ephemeral: true });

  if (member.roles.cache.has(CONFIG.STAFF_ROLE_ID)) {
    return interaction.reply({ content: `${user.tag} is already a staff member.`, ephemeral: true });
  }

  await member.roles.add(role, `Added to staff by ${interaction.user.tag}`);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('Staff Member Added')
    .setDescription(`${user} has been added to the staff team!`)
    .addFields(
      { name: 'Added by', value: `${interaction.user}`, inline: true },
      { name: 'Role', value: role.name, inline: true }
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
        { name: 'Added by', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(guild.iconURL() || '')
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] });
  } catch {
    await interaction.followUp({ content: `Could not DM ${user.tag}. They may have DMs disabled.`, ephemeral: true });
  }
}
