import {
  AuditLogEvent,
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  Guild,
  GuildBasedChannel,
  GuildMember,
  Message,
  TextChannel,
} from 'discord.js';
import { CONFIG } from '../config.js';

async function getOrCreateLogChannel(guild: Guild): Promise<TextChannel | null> {
  const existing = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      channel.name === CONFIG.LOG_CHANNEL_NAME &&
      channel.parentId === CONFIG.LOG_CATEGORY_ID,
  ) as TextChannel | undefined;

  if (existing) return existing;

  const fetchedCategory = await guild.channels.fetch(CONFIG.LOG_CATEGORY_ID).catch(() => null);
  if (!fetchedCategory || fetchedCategory.type !== ChannelType.GuildCategory) {
    console.error(`Log category not found: ${CONFIG.LOG_CATEGORY_ID}`);
    return null;
  }

  const created = await guild.channels.create({
    name: CONFIG.LOG_CHANNEL_NAME,
    type: ChannelType.GuildText,
    parent: CONFIG.LOG_CATEGORY_ID,
  }).catch((error) => {
    console.error('Failed to create log channel:', error);
    return null;
  });

  if (!created || created.type !== ChannelType.GuildText) return null;
  return created;
}

async function sendLog(guild: Guild, embed: EmbedBuilder) {
  const channel = await getOrCreateLogChannel(guild);
  if (!channel || !channel.isSendable()) return;
  await channel.send({ embeds: [embed] }).catch((error) => {
    console.error('Failed to send log message:', error);
  });
}

function shorten(text: string | null | undefined, max = 1000) {
  if (!text) return 'No content';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function channelLabel(channel: GuildBasedChannel | Message['channel']) {
  if ('toString' in channel) return channel.toString();
  return 'Unknown channel';
}

export async function ensureLogChannel(guild: Guild) {
  await getOrCreateLogChannel(guild);
}

async function logKickFromAudit(guild: Guild, targetId: string | null, executorTag: string | null) {
  await sendLog(
    guild,
    new EmbedBuilder()
      .setTitle('👢 Member Kicked')
      .setDescription(
        `**Target ID:** ${targetId ?? 'Unknown'}\n` +
        `**Moderator:** ${executorTag ?? 'Unknown'}`
      )
      .setTimestamp(),
  );
}

export function registerLogEvents(client: Client) {
  client.on(Events.GuildMemberAdd, async (member) => {
    await sendLog(
      member.guild,
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
        new EmbedBuilder()
          .setTitle('📝 Nickname Updated')
          .addFields(
            { name: 'User', value: `${newMember.user.tag}`, inline: true },
            { name: 'User ID', value: newMember.user.id, inline: true },
            { name: 'Before', value: oldMember.nickname ?? 'None' },
            { name: 'After', value: newMember.nickname ?? 'None' },
          )
          .setThumbnail(newMember.user.displayAvatarURL())
          .setTimestamp(),
      );
    }

    const oldRoles = oldMember.roles.cache.filter((r) => r.id !== newMember.guild.id);
    const newRoles = newMember.roles.cache.filter((r) => r.id !== newMember.guild.id);

    const addedRoles = newRoles.filter((r) => !oldRoles.has(r.id));
    const removedRoles = oldRoles.filter((r) => !newRoles.has(r.id));

    if (addedRoles.size > 0 || removedRoles.size > 0) {
      await sendLog(
        newMember.guild,
        new EmbedBuilder()
          .setTitle('🎭 Member Roles Updated')
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
          .setThumbnail(newMember.user.displayAvatarURL())
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
        new EmbedBuilder()
          .setTitle('👤 Username Updated')
          .addFields(
            { name: 'User ID', value: newUser.id, inline: true },
            { name: 'Before', value: oldUser.username, inline: true },
            { name: 'After', value: newUser.username, inline: true },
          )
          .setThumbnail(newUser.displayAvatarURL())
          .setTimestamp(),
      );
    }
  });

  client.on(Events.MessageDelete, async (message: Message) => {
    if (!message.guild || message.author?.bot) return;

    await sendLog(
      message.guild,
      new EmbedBuilder()
        .setTitle('🗑️ Message Deleted')
        .addFields(
          { name: 'User', value: message.author?.tag ?? 'Unknown', inline: true },
          { name: 'User ID', value: message.author?.id ?? 'Unknown', inline: true },
          { name: 'Channel', value: channelLabel(message.channel), inline: true },
          { name: 'Content', value: shorten(message.content) },
        )
        .setTimestamp(),
    );
  });

  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!newMessage.guild || newMessage.author?.bot) return;

    const before = oldMessage.content ?? null;
    const after = newMessage.content ?? null;

    if (before === after) return;

    await sendLog(
      newMessage.guild,
      new EmbedBuilder()
        .setTitle('✏️ Message Edited')
        .addFields(
          { name: 'User', value: newMessage.author?.tag ?? 'Unknown', inline: true },
          { name: 'User ID', value: newMessage.author?.id ?? 'Unknown', inline: true },
          { name: 'Channel', value: channelLabel(newMessage.channel), inline: true },
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
      new EmbedBuilder()
        .setTitle('🔨 User Banned')
        .addFields(
          { name: 'User', value: ban.user.tag, inline: true },
          { name: 'User ID', value: ban.user.id, inline: true },
        )
        .setThumbnail(ban.user.displayAvatarURL())
        .setTimestamp(),
    );
  });

  client.on(Events.GuildBanRemove, async (ban) => {
    await sendLog(
      ban.guild,
      new EmbedBuilder()
        .setTitle('🔓 Ban Removed')
        .addFields(
          { name: 'User', value: ban.user.tag, inline: true },
          { name: 'User ID', value: ban.user.id, inline: true },
        )
        .setThumbnail(ban.user.displayAvatarURL())
        .setTimestamp(),
    );
  });

  client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
    if (entry.action === AuditLogEvent.MemberKick) {
      await logKickFromAudit(guild, entry.targetId ?? null, entry.executor?.tag ?? null);
    }

    if (entry.action === AuditLogEvent.MemberRoleUpdate) {
      await sendLog(
        guild,
        new EmbedBuilder()
          .setTitle('🛡️ Audit Log: Member Role Update')
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
        new EmbedBuilder()
          .setTitle('📘 Audit Log: Channel Created')
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
        new EmbedBuilder()
          .setTitle('📕 Audit Log: Channel Deleted')
          .addFields(
            { name: 'Executor', value: entry.executor?.tag ?? 'Unknown', inline: true },
            { name: 'Target ID', value: entry.targetId ?? 'Unknown', inline: true },
          )
          .setTimestamp(),
      );
    }
  });
}
