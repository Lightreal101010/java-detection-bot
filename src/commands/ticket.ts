import {
  ChatInputCommandInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
  OverwriteType,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { CONFIG } from '../config.js';

const openTickets = new Map<string, string>();

async function handleTicket(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;

  if (!guild) {
    await interaction.reply({
      content: 'Server only.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const existing = openTickets.get(interaction.user.id);

  if (existing) {
    await interaction.reply({
      content: `You already have an open ticket: <#${existing}>`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const category = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('ticket'),
  );

  const channel = await guild.channels.create({
    name: `ticket-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: category?.id,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
        type: OverwriteType.Role,
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        type: OverwriteType.Member,
      },
      {
        id: guild.roles.cache.get(CONFIG.STAFF_ROLE_ID)?.id ?? guild.ownerId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        type: OverwriteType.Role,
      },
    ],
  });

  openTickets.set(interaction.user.id, channel.id);

  const closeButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`close_ticket_${interaction.user.id}`)
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger),
  );

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Ticket Opened')
    .setDescription(
      `Welcome ${interaction.user}! Please describe your issue and a staff member will assist you shortly.\n\nClick **Close Ticket** when your issue is resolved.`,
    )
    .setTimestamp();

  await channel.send({ embeds: [embed], components: [closeButton] });

  await interaction.reply({
    content: `Your ticket has been opened: ${channel}`,
    flags: MessageFlags.Ephemeral,
  });
}

async function handleCloseTicketButton(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const isStaff =
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) ||
    (interaction.member as any)?.roles?.cache?.has(CONFIG.STAFF_ROLE_ID);

  const ticketOwnerId = interaction.customId.replace('close_ticket_', '');
  const isOwner = interaction.user.id === ticketOwnerId;

  if (!isStaff && !isOwner) {
    await interaction.reply({
      content: 'Only staff or the ticket owner can close this ticket.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  openTickets.delete(ticketOwnerId);

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('Ticket Closed')
    .setDescription(`Closed by ${interaction.user}.\nThis channel will be deleted in 5 seconds.`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  setTimeout(async () => {
    await (interaction.channel as TextChannel)?.delete().catch(() => {});
  }, 5000);
}

export { handleTicket, handleCloseTicketButton };

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Open a private support ticket'),

  async execute(interaction: ChatInputCommandInteraction) {
    await handleTicket(interaction);
  },
};
