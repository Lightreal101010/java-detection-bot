import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
} from 'discord.js';

import { registerCommands } from './commands/register.js';
import { handleInteraction } from './handlers/interaction.js';
import { registerLogEvents, ensureLogChannels, sendTicketLog } from './handlers/logs.js';
import { CONFIG } from './config.js';

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('DISCORD_BOT_TOKEN is not set!');
  process.exit(1);
}

const recentJoins = new Map<string, number[]>();
const recentMessages = new Map<string, number[]>();
const duplicateMessages = new Map<string, { content: string; timestamps: number[] }>();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.User,
  ],
});

async function sendProtectionLog(guildId: string, title: string, description: string) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  await sendTicketLog(guild, {
    embeds: [
      {
        title,
        description,
        timestamp: new Date().toISOString(),
      },
    ],
  }).catch(() => null);
}

function containsInviteLink(content: string) {
  return /(?:discord\.gg|discord\.com\/invite)\/[A-Za-z0-9-]+/i.test(content);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Bot online as ${readyClient.user.tag}`);

  try {
    await registerCommands(readyClient);
    console.log('Slash commands registered successfully');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }

  for (const [, guild] of readyClient.guilds.cache) {
    await ensureLogChannels(guild);
  }

  registerLogEvents(readyClient);
});

client.on(Events.InteractionCreate, handleInteraction);

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    await member.roles.add(CONFIG.MEMBER_ROLE_ID);
    console.log(`Member role added to ${member.user.tag}`);
  } catch (error) {
    console.error('Auto role error:', error);
  }

  const now = Date.now();

  // Raid join tracking
  const joins = recentJoins.get(member.guild.id) ?? [];
  const filteredJoins = joins.filter((ts) => now - ts <= 15000);
  filteredJoins.push(now);
  recentJoins.set(member.guild.id, filteredJoins);

  if (filteredJoins.length >= 6) {
    await sendProtectionLog(
      member.guild.id,
      '⚠️ Raid Warning',
      `Possible raid detected.\n**Joins in 15s:** ${filteredJoins.length}\n**Latest user:** ${member.user.tag} (${member.user.id})`,
    );
  }

  // New account warning
  const accountAgeMs = now - member.user.createdTimestamp;
  const oneDay = 24 * 60 * 60 * 1000;

  if (accountAgeMs < oneDay) {
    await sendProtectionLog(
      member.guild.id,
      '🆕 New Account Joined',
      `A very new account joined the server.\n**User:** ${member.user.tag}\n**User ID:** ${member.user.id}\n**Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
    );
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;

  const now = Date.now();
  const userKey = `${message.guild.id}:${message.author.id}`;

  // Spam detection
  const spamTimestamps = recentMessages.get(userKey) ?? [];
  const filteredSpam = spamTimestamps.filter((ts) => now - ts <= 5000);
  filteredSpam.push(now);
  recentMessages.set(userKey, filteredSpam);

  if (filteredSpam.length >= 7) {
    await sendProtectionLog(
      message.guild.id,
      '🚨 Spam Warning',
      `Possible spam detected.\n**User:** ${message.author.tag} (${message.author.id})\n**Channel:** ${message.channel}\n**Messages in 5s:** ${filteredSpam.length}`,
    );
  }

  // Duplicate spam detection
  const normalizedContent = message.content.trim().toLowerCase();
  if (normalizedContent) {
    const dupeEntry = duplicateMessages.get(userKey) ?? { content: '', timestamps: [] };

    if (dupeEntry.content === normalizedContent) {
      dupeEntry.timestamps = dupeEntry.timestamps.filter((ts) => now - ts <= 15000);
      dupeEntry.timestamps.push(now);
    } else {
      dupeEntry.content = normalizedContent;
      dupeEntry.timestamps = [now];
    }

    duplicateMessages.set(userKey, dupeEntry);

    if (dupeEntry.timestamps.length >= 4) {
      await sendProtectionLog(
        message.guild.id,
        '📢 Duplicate Message Spam',
        `Repeated message detected.\n**User:** ${message.author.tag} (${message.author.id})\n**Channel:** ${message.channel}\n**Count:** ${dupeEntry.timestamps.length}\n**Message:** ${message.content.slice(0, 500) || 'No content'}`,
      );
    }
  }

  // Everyone / here mention detection
  if (message.mentions.everyone) {
    await sendProtectionLog(
      message.guild.id,
      '⚠️ Mass Mention Warning',
      `A mass mention was used.\n**User:** ${message.author.tag} (${message.author.id})\n**Channel:** ${message.channel}\n**Content:** ${message.content.slice(0, 500) || 'No content'}`,
    );
  }

  // Invite link detection
  if (containsInviteLink(message.content)) {
    await sendProtectionLog(
      message.guild.id,
      '🔗 Invite Link Detected',
      `An invite link was posted.\n**User:** ${message.author.tag} (${message.author.id})\n**Channel:** ${message.channel}\n**Content:** ${message.content.slice(0, 500)}`,
    );
  }

  // Excessive caps warning
  const lettersOnly = message.content.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length >= 12) {
    const upper = [...lettersOnly].filter((c) => c === c.toUpperCase()).length;
    const ratio = upper / lettersOnly.length;

    if (ratio >= 0.8) {
      await sendProtectionLog(
        message.guild.id,
        '🔊 Excessive Caps Warning',
        `Possible shouting / caps spam detected.\n**User:** ${message.author.tag} (${message.author.id})\n**Channel:** ${message.channel}\n**Content:** ${message.content.slice(0, 500)}`,
      );
    }
  }
});

client.on(Events.GuildCreate, async (guild) => {
  await ensureLogChannels(guild);
});

client.login(token).catch((error) => {
  console.error('Discord login failed:', error);
  process.exit(1);
});
