import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Interaction,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  escapeMarkdown,
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

function getTicketTypeFromName(name: string) {
  if (name.startsWith('support-')) return 'support';
  if (name.startsWith('scanner-')) return 'scanner';
  if (name.startsWith('partnership-')) return 'partnership';
  return 'unknown';
}

function getTicketOwnerIdFromName(name: string) {
  const parts = name.split('-');
  return parts[parts.length - 1] || null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function buildTranscriptHtml(channel: any) {
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

  const messageBlocks = allMessages.map((msg) => {
    const created = new Date(msg.createdTimestamp).toLocaleString();
    const author = msg.author
      ? `${escapeHtml(msg.author.tag)} (${msg.author.id})`
      : 'Unknown User';

    const content = msg.content
      ? `<div class="content">${escapeHtml(msg.content).replace(/\n/g, '<br>')}</div>`
      : `<div class="content muted">No text content</div>`;

    const attachments = msg.attachments?.size
      ? `<div class="attachments">${[...msg.attachments.values()]
          .map(
            (a: any) =>
              `<div><a href="${escapeHtml(a.url)}" target="_blank" rel="noreferrer">${escapeHtml(a.name ?? 'attachment')}</a></div>`,
          )
          .join('')}</div>`
      : '';

    return `
      <div class="message">
        <div class="meta">
          <span class="author">${author}</span>
          <span class="time">${escapeHtml(created)}</span>
        </div>
        ${content}
        ${attachments}
      </div>
    `;
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Transcript - ${escapeHtml(channel.name)}</title>
<style>
  body {
    font-family: Arial, sans-serif;
    background: #0f1115;
    color: #e7eaf0;
    margin: 0;
    padding: 24px;
  }
  .wrap {
    max-width: 1000px;
    margin: 0 auto;
  }
  .header {
    background: #171a21;
    border: 1px solid #2b313d;
    border-radius: 12px;
    padding: 18px;
    margin-bottom: 18px;
  }
  .header h1 {
    margin: 0 0 8px 0;
    font-size: 22px;
  }
  .header .sub {
    color: #aeb7c5;
    font-size: 14px;
  }
  .message {
    background: #171a21;
    border: 1px solid #2b313d;
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 12px;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
    font-size: 13px;
    color: #aeb7c5;
  }
  .author {
    color: #ffffff;
    font-weight: bold;
  }
  .content {
    white-space: normal;
    line-height: 1.5;
    word-break: break-word;
  }
  .muted {
    color: #98a2b3;
    font-style: italic;
  }
  .attachments {
    margin-top: 10px;
    font-size: 14px;
  }
  a {
    color: #7ab8ff;
    text-decoration: none;
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Transcript for #${escapeHtml(channel.name)}</h1>
      <div class="sub">Channel ID: ${channel.id}</div>
      <div class="sub">Generated: ${escapeHtml(new Date().toISOString())}</div>
    </div>
    ${messageBlocks.join('\n')}
  </div>
</body>
</html>`;
}

export async function handleInteraction(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = getSlashCommand(interaction.commandName);

      if (!command) {
        await interaction.reply({
          content: 'This command is not loaded correctly.',
          flags: 64,
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
          flags: 64,
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
        flags: 64,
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
          flags: 64,
        });
        return;
      }

      if (!isValidTicketChannelName(channel.name)) {
        await interaction.reply({
          content: 'This is not a valid ticket channel.',
          flags: 64,
        });
        return;
      }

      await interaction.reply({
        content: 'Saving transcript and closing this ticket in 3 seconds...',
      });

      const ownerId = getTicketOwnerIdFromName(channel.name);
      const ticketType = getTicketTypeFromName(channel.name);

      const transcriptHtml = await buildTranscriptHtml(channel);
      const transcriptBuffer = Buffer.from(transcriptHtml, 'utf-8');

      const transcriptFileForLog = new AttachmentBuilder(Buffer.from(transcriptHtml, 'utf-8'), {
        name: `${channel.name}-transcript.html`,
      });

      await sendTicketLog(interaction.guild, {
        embeds: [
          new EmbedBuilder()
            .setTitle('🔒 Ticket Closed')
            .setDescription(
              `**Channel:** #${channel.name}\n` +
              `**Closed by:** ${interaction.user.tag}\n` +
              `**Owner ID:** ${ownerId ?? 'Unknown'}\n` +
              `**Type:** ${prettyType(ticketType)}`
            ),
        ],
        files: [transcriptFileForLog],
      });

      if (ownerId) {
        const ownerUser = await interaction.client.users.fetch(ownerId).catch(() => null);

        if (ownerUser) {
          const transcriptFileForDm = new AttachmentBuilder(transcriptBuffer, {
            name: `${channel.name}-transcript.html`,
          });

          await ownerUser.send({
            content: `Here is the transcript for your closed ticket **${channel.name}**.`,
            files: [transcriptFileForDm],
          }).catch(() => null);
        }
      }

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
        flags: 64,
      }).catch(() => null);
    }
  }
}
