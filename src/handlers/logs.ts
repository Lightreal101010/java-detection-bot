import {
  AuditLogEvent,
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  Guild,
  GuildMember,
  TextChannel,
} from 'discord.js';
import { CONFIG } from '../config.js';

type LogChannelKey =
  | 'join-logs'
  | 'message-logs'
  | 'moderation-logs'
  | 'channel-logs'
  | 'role-logs'
  | 'audit-logs'
  | 'ticket-logs';

const channelCache = new Map<string, string>();

async function getOrCreateLogChannel(
  guild: Guild,
  channelName: LogChannelKey,
): Promise<TextChannel | null> {
  const cacheKey = `${guild.id}:${channelName}`;
  const cachedId = channelCache.get(cacheKey);

  if (cachedId) {
    const cachedChannel = guild.channels.cache.get(cachedId);
    if (cachedChannel && cachedChannel.type === ChannelType.GuildText) {
      return cachedChannel;
    }
  }

  const existing = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      channel.name === channelName &&
      channel.parentId === CONFIG.LOG_CATEGORY_ID,
  ) as TextChannel | undefined;

  if (existing) {
    channelCache.set(cacheKey, existing.id);
    return existing;
  }

  const category = await guild.channels.fetch(CONFIG.LOG_CATEGORY_ID).catch(() => null);
  if (!category || category.type !== ChannelType.GuildCategory) {
    console.error(`Log category not found: ${CONFIG.LOG_CATEGORY_ID}`);
    return null;
  }

  const created = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: CONFIG.LOG_CATEGORY_ID,
  }).catch((error) => {
    console.error(`Failed to create log channel ${channelName}:`, error);
    return null;
  });

  if (!created || created.type !== ChannelType.GuildText) return null;

  channelCache.set(cacheKey, created.id);
  return created;
}

async function sendLog(
  guild: Guild,
  channelName: LogChannelKey,
  embed: EmbedBuilder,
) {
  const channel = await getOrCreateLogChannel(guild, channelName);
  if (!channel || !channel.isSendable()) return;

  await channel.send({ embeds: [embed] }).catch((error) => {
    console.error(`Failed to send log to ${channelName}:`, error);
  });
}

function shorten(text: string | null | undefined, max = 1000) {
  if (!text) return 'No content';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export async function ensureLogChannels(guild: Guild) {
  const channelNames: LogChannelKey[] = [
    'join-logs',
    'message-logs',
    'moderation-logs',
    'channel-logs',
    'role-logs',
    'audit-logs',
    'ticket-logs',
  ];

  for (const name of channelNames) {
    await getOrCreateLogChannel(guild, name);
  }
}

export async function sendTicketLog(guild: Guild, payload: any) {
  const channel = await getOrCreateLogChannel(guild, 'ticket-logs');
  if (!channel || !channel.isSendable()) return;
  await channel.send(payload).catch((error) => {
    console.error('Failed to send ticket log:', error);
  });
}

export function registerLogEvents(client: Client) {
  client.on(Events.GuildMemberAdd, async (member) => {
    await sendLog(
      member.guild,
      'join-logs',
      new EmbedBuilder()
        .setTitle('✅ Member Joined')
        .addFields(
          { name: 'User', value: `${member.user.tag}`, inline: true },
          { name: 'User ID', value: member.user.id, inline: true },
          { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>` },
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp(),
    );
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    await sendLog(
      member.guild,
      'join-logs',
      new EmbedBuilder()
        .setTitle('❌ Member Left')
        .addFields(
          { name: 'User', value: `${member.user.tag}`, inline: true },
          { name: 'User ID', value: member.user.id, inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp(),
    );
  });

  client.on(Events.GuildMemberUpdate, async (oldMember: GuildMember, newMember: GuildMember) => {
    if (oldMember.nickname !== newMember.nickname) {
      await sendLog(
        newMember.guild,
        'moderation-logs',
        new EmbedBuilder()
          .setTitle('📝 Nickname Updated')
          .addFields(
            { name: 'User', value: `${newMember.user.tag}`, inline: true },
            { name: 'User ID', value: newMember.user.id, inline: true },
            { name: 'Before', value: oldMember.nickname ?? 'None' },
            { name: 'After', value: newMember.nickname ?? 'None' },
          )
          .setTimestamp(),
      );
    }

    const oldRoles = oldMember.roles.cache.filter((r) => r.id !== newMember.guild.id);
    const newRoles = newMember.roles.cache.filter((r) => r.id !== newMember.guild.id);

    const addedRoles = newRoles.filter((r) => !oldRoles.has(r.id));
    const removedRoles = oldRoles.filter((r) => !newRoles.has(r.id));

    if (addedRoles.size || removedRoles.size) {
      await sendLog(
        newMember.guild,
        'role-logs',
        new EmbedBuilder()
          .setTitle('🎭 Roles Updated')
          .addFields(
            { name: 'User', value: `${newMember.user.tag}`, inline: true },
            { name: 'User ID', value: newMember.user.id, inline: true },
            {
              name: 'Added Roles',
              value: addedRoles.size ? addedRoles.map((r) => r.toString()).join(', ') : 'None',
            },
            {
              name: 'Removed Roles',
              value: removedRoles.size ? removedRoles.map((r) => r.toString()).join(', ') : 'None',
            },
          )
          .setTimestamp(),
      );
    }
  });

  client.on(Events.UserUpdate, async (oldUser, newUser) => {
    if (oldUser.username === newUser.username) return;

    const guilds = client.guilds.cache.filter((g) => g.members.cache.has(newUser.id));
    for (const [, guild] of guilds) {
      await sendLog(
        guild,
        'moderation-logs',
        new EmbedBuilder()
          .setTitle('👤 Username Updated')
          .addFields(
            { name: 'User ID', value: newUser.id, inline: true },
            { name: 'Before', value: oldUser.username, inline: true },
            { name: 'After', value: newUser.username, inline: true },
          )
          .setTimestamp(),
      );
    }
  });

  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild) return;
    if (message.author?.bot) return;

    await sendLog(
      message.guild,
      'message-logs',
      new EmbedBuilder()
        .setTitle('🗑️ Message Deleted')
        .addFields(
          { name: 'User', value: message.author?.tag ?? 'Unknown', inline: true },
          { name: 'User ID', value: message.author?.id ?? 'Unknown', inline: true },
          { name: 'Channel', value: message.channel.toString(), inline: true },
          { name: 'Content', value: shorten(message.content ?? 'No content') },
        )
        .setTimestamp(),
    );
  });

  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;

    const before = oldMessage.content ?? null;
    const after = newMessage.content ?? null;
    if (before === after) return;

    await sendLog(
      newMessage.guild,
      'message-logs',
      new EmbedBuilder()
        .setTitle('✏️ Message Edited')
        .addFields(
          { name: 'User', value: newMessage.author?.tag ?? 'Unknown', inline: true },
          { name: 'User ID', value: newMessage.author?.id ?? 'Unknown', inline: true },
          { name: 'Channel', value: newMessage.channel.toString(), inline: true },
          { name: 'Before', value: shorten(before) },
          { name: 'After', value: shorten(after) },
          { name: 'Message Link', value: newMessage.url || 'Unavailable' },
        )
        .setTimestamp(),
    );
  });

  client.on(Events.ChannelCreate, async (channel) => {
    if (!('guild' in channel)) return;

    await sendLog(
      channel.guild,
      'channel-logs',
      new EmbedBuilder()
        .setTitle('📁 Channel Created')
        .addFields(
          { name: 'Name', value: channel.name, inline: true },
          { name: 'Channel ID', value: channel.id, inline: true },
          { name: 'Type', value: `${channel.type}`, inline: true },
          { name: 'Category ID', value: channel.parentId ?? 'None' },
        )
        .setTimestamp(),
    );
  });

  client.on(Events.ChannelDelete, async (channel) => {
    if (!('guild' in channel)) return;

    await sendLog(
      channel.guild,
      'channel-logs',
      new EmbedBuilder()
        .setTitle('🗑️ Channel Deleted')
        .addFields(
          { name: 'Name', value: channel.name, inline: true },
          { name: 'Channel ID', value: channel.id, inline: true },
          { name: 'Type', value: `${channel.type}`, inline: true },
        )
        .setTimestamp(),
    );
  });

  client.on('roleCreate', async (role) => {
    await sendLog(
      role.guild,
      'role-logs',
      new EmbedBuilder()
        .setTitle('➕ Role Created')
        .addFields(
          { name: 'Role', value: role.name, inline: true },
          { name: 'Role ID', value: role.id, inline: true },
          { name: 'Color', value: role.hexColor, inline: true },
        )
        .setTimestamp(),
    );
  });

  client.on('roleDelete', async (role) => {
    await sendLog(
      role.guild,
      'role-logs',
      new EmbedBuilder()
        .setTitle('➖ Role Deleted')
        .addFields(
          { name: 'Role', value: role.name, inline: true },
          { name: 'Role ID', value: role.id, inline: true },
        )
        .setTimestamp(),
    );
  });

  client.on(Events.GuildBanAdd, async (ban) => {
    await sendLog(
      ban.guild,
      'moderation-logs',
      new EmbedBuilder()
        .setTitle('🔨 User Banned')
        .addFields(
          { name: 'User', value: ban.user.tag, inline: true },
          { name: 'User ID', value: ban.user.id, inline: true },
        )
        .setTimestamp(),
    );
  });

  client.on(Events.GuildBanRemove, async (ban) => {
    await sendLog(
      ban.guild,
      'moderation-logs',
      new EmbedBuilder()
        .setTitle('🔓 Ban Removed')
        .addFields(
          { name: 'User', value: ban.user.tag, inline: true },
          { name: 'User ID', value: ban.user.id, inline: true },
        )
        .setTimestamp(),
    );
  });

  client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
    if (entry.action === AuditLogEvent.MemberKick) {
      await sendLog(
        guild,
        'audit-logs',
        new EmbedBuilder()
          .setTitle('👢 Member Kicked')
          .addFields(
            { name: 'Target ID', value: entry.targetId ?? 'Unknown', inline: true },
            { name: 'Moderator', value: entry.executor?.tag ?? 'Unknown', inline: true },
          )
          .setTimestamp(),
      );
    }

    if (entry.action === AuditLogEvent.MemberRoleUpdate) {
      await sendLog(
        guild,
        'audit-logs',
        new EmbedBuilder()
          .setTitle('🛡️ Audit: Member Role Update')
          .addFields(
            { name: 'Target ID', value: entry.targetId ?? 'Unknown', inline: true },
            { name: 'Executor', value: entry.executor?.tag ?? 'Unknown', inline: true },
          )
          .setTimestamp(),
      );
    }

    if (entry.action === AuditLogEvent.ChannelCreate) {
      await sendLog(
        guild,
        'audit-logs',
        new EmbedBuilder()
          .setTitle('📘 Audit: Channel Created')
          .addFields(
            { name: 'Executor', value: entry.executor?.tag ?? 'Unknown', inline: true },
            { name: 'Target ID', value: entry.targetId ?? 'Unknown', inline: true },
          )
          .setTimestamp(),
      );
    }

    if (entry.action === AuditLogEvent.ChannelDelete) {
      await sendLog(
        guild,
        'audit-logs',
        new EmbedBuilder()
          .setTitle('📕 Audit: Channel Deleted')
          .addFields(
            { name: 'Executor', value: entry.executor?.tag ?? 'Unknown', inline: true },
            { name: 'Target ID', value: entry.targetId ?? 'Unknown', inline: true },
          )
          .setTimestamp(),
      );
    }
  });
}
