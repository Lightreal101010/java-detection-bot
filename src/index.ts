import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
} from 'discord.js';

import { registerCommands } from './commands/register.js';
import { handleInteraction } from './handlers/interaction.js';
import { registerLogEvents } from './handlers/logs.js';
import { CONFIG } from './config.js';

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('DISCORD_BOT_TOKEN is not set!');
  process.exit(1);
}

const recentJoins = new Map<string, number[]>();

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

async function sendRaidLog(guildId: string, text: string) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const channel = await guild.channels.fetch(CONFIG.MOD_LOG_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isSendable()) return;

  await channel.send({ content: text }).catch(() => null);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Bot online as ${readyClient.user.tag}`);

  try {
    await registerCommands(readyClient);
    console.log('Slash commands registered successfully');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
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
  const joins = recentJoins.get(member.guild.id) ?? [];
  const filtered = joins.filter((ts) => now - ts <= 15000);
  filtered.push(now);
  recentJoins.set(member.guild.id, filtered);

  if (filtered.length >= 6) {
    await sendRaidLog(
      member.guild.id,
      `⚠️ Possible raid detected: ${filtered.length} joins in 15 seconds.`,
    );
  }
});

client.login(token).catch((error) => {
  console.error('Discord login failed:', error);
  process.exit(1);
});
