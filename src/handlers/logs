import {
  AuditLogEvent,
  Client,
  EmbedBuilder,
  Events,
  Guild,
  Message,
  TextBasedChannel,
} from 'discord.js';

const modLogChannelId = process.env.MOD_LOG_CHANNEL_ID || '';

async function getLogChannel(guild: Guild): Promise<TextBasedChannel | null> {
  if (!modLogChannelId) return null;

  const channel = await guild.channels.fetch(modLogChannelId).catch(() => null);
  if (!channel) return null;
  if (!channel.isTextBased()) return null;

  return channel;
}

async function sendLog(guild: Guild, embed: EmbedBuilder) {
  const logChannel = await getLogChannel(guild);
  if (!logChannel) return;

  await logChannel.send({ embeds: [embed] }).catch(() => null);
}

function safeContent(content: string | null | undefined, max = 900) {
  if (!content) return 'Kein Inhalt';
  return content.length > max ? `${content.slice(0, max)}...` : content;
}

export function registerLogEvents(client: Client) {
  client.on(Events.GuildMemberAdd, async (member) => {
    await sendLog(
      member.guild,
      new EmbedBuilder()
        .setTitle('✅ Member Joined')
        .setDescription(`${member.user.tag} ist dem Server beigetreten.`),
    );
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    await sendLog(
      member.guild,
      new EmbedBuilder()
        .setTitle('❌ Member Left')
        .setDescription(`${member.user.tag} hat den Server verlassen.`),
    );
  });

  client.on(Events.MessageDelete, async (message: Message) => {
    if (!message.guild || message.author?.bot) return;

    await sendLog(
      message.guild,
      new EmbedBuilder()
        .setTitle('🗑️ Nachricht gelöscht')
        .addFields(
          { name: 'User', value: message.author ? `${message.author.tag}` : 'Unbekannt', inline: true },
          { name: 'Channel', value: message.channel.toString(), inline: true },
          { name: 'Inhalt', value: safeContent(message.content) },
        ),
    );
  });

  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;

    const oldContent = 'content' in oldMessage ? oldMessage.content : null;
    const newContent = newMessage.content;

    if (oldContent === newContent) return;

    await sendLog(
      newMessage.guild,
      new EmbedBuilder()
        .setTitle('✏️ Nachricht bearbeitet')
        .addFields(
          { name: 'User', value: newMessage.author ? `${newMessage.author.tag}` : 'Unbekannt', inline: true },
          { name: 'Channel', value: newMessage.channel.toString(), inline: true },
          { name: 'Alt', value: safeContent(oldContent) },
          { name: 'Neu', value: safeContent(newContent) },
        ),
    );
  });

  client.on(Events.ChannelCreate, async (channel) => {
    if (!channel.guild) return;

    await sendLog(
      channel.guild,
      new EmbedBuilder()
        .setTitle('📁 Channel erstellt')
        .setDescription(`Channel: ${channel.toString()}`),
    );
  });

  client.on(Events.ChannelDelete, async (channel) => {
    if (!channel.guild) return;

    await sendLog(
      channel.guild,
      new EmbedBuilder()
        .setTitle('🗑️ Channel gelöscht')
        .setDescription(`Name: ${channel.name}`),
    );
  });

  client.on(Events.RoleCreate, async (role) => {
    await sendLog(
      role.guild,
      new EmbedBuilder()
        .setTitle('➕ Rolle erstellt')
        .setDescription(`Rolle: ${role.name}`),
    );
  });

  client.on(Events.RoleDelete, async (role) => {
    await sendLog(
      role.guild,
      new EmbedBuilder()
        .setTitle('➖ Rolle gelöscht')
        .setDescription(`Rolle: ${role.name}`),
    );
  });

  client.on(Events.GuildBanAdd, async (ban) => {
    await sendLog(
      ban.guild,
      new EmbedBuilder()
        .setTitle('🔨 User gebannt')
        .setDescription(`User: ${ban.user.tag}`),
    );
  });

  client.on(Events.GuildBanRemove, async (ban) => {
    await sendLog(
      ban.guild,
      new EmbedBuilder()
        .setTitle('🔓 Ban entfernt')
        .setDescription(`User: ${ban.user.tag}`),
    );
  });

  client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
    if (!guild) return;

    if (entry.action === AuditLogEvent.MemberKick) {
      await sendLog(
        guild,
        new EmbedBuilder()
          .setTitle('👢 User gekickt')
          .setDescription(
            `Target: ${entry.targetId ?? 'Unbekannt'}\n` +
            `Von: ${entry.executor?.tag ?? 'Unbekannt'}`
          ),
      );
    }
  });
}
