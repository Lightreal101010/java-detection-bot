import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  GuildMember,
  Interaction,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
} from 'discord.js';
import { CONFIG } from '../config.js';

async function sendTicketLog(guild: any, payload: any) {
  const channel = await guild.channels.fetch(CONFIG.TICKET_LOG_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isSendable()) return;
  await channel.send(payload).catch(() => null);
}

function prettyType(type: string) {
  switch (type) {
    case 'support':
      return 'Support';
    case 'scanner':
      return 'Scanner Help';
    case 'partnership':
      return 'Partnership';
    default:
      return 'Ticket';
  }
}

function getCategoryId(type: string) {
  switch (type) {
    case 'support':
      return CONFIG.SUPPORT_CATEGORY_ID;
    case 'scanner':
      return CONFIG.SCANNER_CATEGORY_ID;
    case 'partnership':
      return CONFIG.PARTNERSHIP_CATEGORY_ID;
    default:
      return CONFIG.SUPPORT_CATEGORY_ID;
  }
}

function makeTicketName(type: string, userId: string) {
  return `${type}-${userId}`;
}

function escapeTranscriptText(value: string | null | undefined) {
  if (!value) return '';
  return value.replace(/\r/g, '');
}

async function buildTranscript(channel: any) {
  const allMessages: any[] = [];
  let lastId: string | undefined;

  while (true) {
    const fetched = await channel.messages.fetch({
      limit: 100,
      before: lastId,
    });

    if (!fetched || fetched.size === 0) break;

    const batch = [...fetched.values()];
    allMessages.push(...batch);

    if (fetched.size < 100) break;
    lastId = batch[batch.length - 1].id;
  }

  allMessages.reverse();

  const lines: string[] = [];
  lines.push(`Transcript for #${channel.name}`);
  lines.push(`Channel ID: ${channel.id}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('='.repeat(60));

  for (const msg of allMessages) {
    const created = new Date(msg.createdTimestamp).toISOString();
    const author = msg.author ? `${msg.author.tag} (${msg.author.id})` : 'Unknown User';
    const content = escapeTranscriptText(msg.content) || '[no text content]';

    lines.push(`[${created}] ${author}`);
    lines.push(content);

    if (msg.attachments?.size) {
      for (const attachment of msg.attachments.values()) {
        lines.push(`Attachment: ${attachment.name} -> ${attachment.url}`);
      }
    }

    lines.push('-'.repeat(60));
  }

  return lines.join('\n');
}

async function sendTicketPanel(interaction: Interaction) {
  if (!interaction.isRepliable() || !interaction.guild) return;

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
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      {
        label: 'Support',
        description: 'General support and questions',
        value: 'support',
        emoji: '🎫',
      },
      {
        label: 'Scanner Help',
        description: 'Help with scanner setup and scanner issues',
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

  if ('channel' in interaction && interaction.channel && interaction.channel.isSendable()) {
    await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });
  }
}

export async function handleInteraction(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'ticketpanel') {
        await sendTicketPanel(interaction);
        return;
      }

      if (interaction.commandName === 'ticket') {
        const sub = interaction.options.getSubcommand(false);
        if (sub === 'send') {
          await sendTicketPanel(interaction);
          return;
        }
      }

      if (interaction.commandName === 'ping') {
        await interaction.reply({
          content: `Pong! ${interaction.client.ws.ping}ms`,
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === 'help') {
        await interaction.reply({
          content:
            '**Commands:**\n' +
            '/ticketpanel\n' +
            '/ticket send\n' +
            '/ping\n' +
            '/help\n' +
            '/staff',
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === 'staff') {
        await interaction.reply({
          content: `Staff role: <@&${CONFIG.STAFF_ROLE_ID}>`,
          ephemeral: true,
        });
        return;
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (!interaction.guild) return;
      if (interaction.customId !== 'ticket_type_select') return;

      const type = interaction.values[0];
      const name = makeTicketName(type, interaction.user.id);

      const existing = interaction.guild.channels.cache.find(
        (ch) => ch.type === ChannelType.GuildText && ch.name === name,
      );

      if (existing) {
        await interaction.reply({
          content: `You already have an open ${prettyType(type)} ticket: ${existing}`,
          ephemeral: true,
        });
        return;
      }

      const channel = await interaction.guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: getCategoryId(type),
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: CONFIG.MEMBER_ROLE_ID,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
            ],
          },
          {
            id: CONFIG.STAFF_ROLE_ID,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages,
            ],
          },
          {
            id: interaction.client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ManageMessages,
            ],
          },
        ],
      });

      const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger),
      );

      const embed = new EmbedBuilder()
        .setTitle(`📩 ${prettyType(type)} Ticket`)
        .setDescription(
          `Hello ${interaction.user},\n\n` +
          `Please explain your issue in detail.\n` +
          `A staff member will help you as soon as possible.\n\n` +
          `**Category:** ${prettyType(type)}`
        );

      await channel.send({
        content: `<@${interaction.user.id}> <@&${CONFIG.STAFF_ROLE_ID}>`,
        embeds: [embed],
        components: [closeRow],
      });

      await interaction.reply({
        content: `Your ${prettyType(type)} ticket has been created: ${channel}`,
        ephemeral: true,
      });

      await sendTicketLog(interaction.guild, {
        embeds: [
          new EmbedBuilder()
            .setTitle('📂 Ticket Created')
            .setDescription(
              `**User:** ${interaction.user.tag}\n` +
              `**User ID:** ${interaction.user.id}\n` +
              `**Type:** ${prettyType(type)}\n` +
              `**Channel:** ${channel}`
            ),
        ],
      });

      return;
    }

    if (interaction.isButton()) {
      if (!interaction.guild) return;
      if (interaction.customId !== 'close_ticket') return;

      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({
          content: 'This only works in a ticket channel.',
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: 'Saving transcript and closing this ticket in 3 seconds...',
      });

      const transcriptText = await buildTranscript(channel);
      const transcriptBuffer = Buffer.from(transcriptText, 'utf-8');
      const transcriptFile = new AttachmentBuilder(transcriptBuffer, {
        name: `${channel.name}-transcript.txt`,
      });

      await sendTicketLog(interaction.guild, {
        embeds: [
          new EmbedBuilder()
            .setTitle('🔒 Ticket Closed')
            .setDescription(
              `**Channel:** #${channel.name}\n` +
              `**Closed by:** ${interaction.user.tag}`
            ),
        ],
        files: [transcriptFile],
      });

      setTimeout(async () => {
        await channel.delete().catch(() => null);
      }, 3000);
    }
  } catch (error) {
    console.error('Interaction handler error:', error);

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'An error occurred while processing this interaction.',
        ephemeral: true,
      }).catch(() => null);
    }
  }
}
