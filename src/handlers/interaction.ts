import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Interaction,
  PermissionFlagsBits,
} from 'discord.js';
import { CONFIG } from '../config.js';
import { getSlashCommand } from '../commands/registry.js';

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

function isValidTicketChannelName(name: string) {
  return (
    name.startsWith('support-') ||
    name.startsWith('scanner-') ||
    name.startsWith('partnership-')
  );
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
  lines.push('='.repeat(70));

  for (const msg of allMessages) {
    const created = new Date(msg.createdTimestamp).toISOString();
    const author = msg.author
      ? `${msg.author.tag} (${msg.author.id})`
      : 'Unknown User';
    const content = escapeTranscriptText(msg.content) || '[no text content]';

    lines.push(`[${created}] ${author}`);
    lines.push(content);

    if (msg.attachments?.size) {
      for (const attachment of msg.attachments.values()) {
        lines.push(`Attachment: ${attachment.name} -> ${attachment.url}`);
      }
    }

    if (msg.embeds?.length) {
      lines.push(`[Embeds: ${msg.embeds.length}]`);
    }

    lines.push('-'.repeat(70));
  }

  return lines.join('\n');
}

export async function handleInteraction(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = getSlashCommand(interaction.commandName);

      if (!command) {
        await interaction.reply({
          content: 'This command is not loaded correctly.',
          ephemeral: true,
        });
        return;
      }

      await command.execute(interaction);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (!interaction.guild) return;
      if (interaction.customId !== 'ticket_type_select') return;

      const type = interaction.values[0];
      const name = `${type}-${interaction.user.id}`;

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

      let parentCategoryId = CONFIG.SUPPORT_CATEGORY_ID;
      if (type === 'scanner') parentCategoryId = CONFIG.SCANNER_CATEGORY_ID;
      if (type === 'partnership') parentCategoryId = CONFIG.PARTNERSHIP_CATEGORY_ID;

      const channel = await interaction.guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: parentCategoryId,
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

      if (!isValidTicketChannelName(channel.name)) {
        await interaction.reply({
          content: 'This is not a valid ticket channel.',
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

      return;
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
