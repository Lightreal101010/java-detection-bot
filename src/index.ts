import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
} from 'discord.js';
import { registerCommands } from './commands/register.js';
import { handleInteraction } from './handlers/interaction.js';
import { handleMessage } from './handlers/message.js';
import { handleGuildMemberAdd } from './handlers/welcome.js';

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('DISCORD_BOT_TOKEN is not set!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
  ],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Bot is online as ${readyClient.user.tag}`);
  console.log(`Serving ${readyClient.guilds.cache.size} guild(s)`);

  try {
    await registerCommands(readyClient);
    console.log('Slash commands registered successfully');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
});

client.on(Events.InteractionCreate, handleInteraction);
client.on(Events.MessageCreate, handleMessage);
client.on(Events.GuildMemberAdd, handleGuildMemberAdd);

client.login(token).catch((err) => {
  console.error('Discord login failed:', err);
  process.exit(1);
});
