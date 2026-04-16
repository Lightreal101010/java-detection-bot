import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Send the ticket panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command only works inside a server.',
        ephemeral: true,
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);

    if (!(member instanceof GuildMember)) {
      await interaction.reply({
        content: 'Could not verify your permissions.',
        ephemeral: true,
      });
      return;
    }

    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: 'You need the "Manage Server" permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Open a Ticket')
      .setDescription(
        'Select the type of ticket you want to open.\n\n' +
        '• Support\n' +
        '• Scanner Help\n' +
        '• Partnership'
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_type_select')
      .setPlaceholder('Choose a ticket type')
      .addOptions(
        {
          label: 'Support',
          description: 'General support and questions',
          value: 'support',
          emoji: '🎫',
        },
        {
          label: 'Scanner Help',
          description: 'Help with scanner setup and issues',
          value: 'scanner',
          emoji: '🛠️',
        },
        {
          label: 'Partnership',
          description: 'Business and partnership inquiries',
          value: 'partnership',
          emoji: '🤝',
        },
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

    await interaction.reply({
      content: 'Ticket panel sent.',
      ephemeral: true,
    });

    if (interaction.channel?.isSendable()) {
      await interaction.channel.send({
        embeds: [embed],
        components: [row],
      });
    }
  },
};
