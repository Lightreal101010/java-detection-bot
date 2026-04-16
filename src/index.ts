import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
} from 'discord.js';
import { registerCommands } from './commands/register.js';
import { handleInteraction } from './handlers/interaction.js';
import { handleMessage } from './handlers/message.js';
import { registerLogEvents } from './handlers/logs.js';

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
    GatewayIntentBits.GuildModeration,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.User,
  ],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Bot online as ${readyClient.user.tag}`);

  try {
    await registerCommands(readyClient);
    console.log('Slash commands registered');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }

  registerLogEvents(readyClient);
});

client.on(Events.InteractionCreate, handleInteraction);
client.on(Events.MessageCreate, handleMessage);

client.login(token).catch((error) => {
  console.error('Login failed:', error);
  process.exit(1);
});
