import { Message, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getAIResponse } from '../services/ai.js';
import { CONFIG } from '../config.js';

const conversationHistories = new Map<string, { role: 'user' | 'assistant'; content: string }[]>();
const adminTakenOver = new Map<string, number>();
const TAKEOVER_COOLDOWN = 5 * 60 * 1000;

const AYDO_NAMES = ['aydo', 'aydoo', 'aydo.', '@aydo'];

function isAdmin(message: Message): boolean {
  if (!message.member) return false;
  return (
    message.member.permissions.has(PermissionFlagsBits.Administrator) ||
    message.member.roles.cache.some(r => r.name.toLowerCase() === CONFIG.ADMIN_ROLE_NAME.toLowerCase())
  );
}

function mentionsAydo(content: string): boolean {
  const lower = content.toLowerCase();
  return AYDO_NAMES.some(name => lower.includes(name));
}

function shouldAIRespond(message: Message): boolean {
  if (message.author.bot) return false;
  if (!message.guild) return false;
  const botUser = message.client.user;
  if (!botUser) return false;
  const isMentioned = message.mentions.has(botUser);
  const isReplyToBot =
    message.reference?.messageId
      ? message.channel.messages.cache.get(message.reference.messageId)?.author?.id === botUser.id
      : false;
  return isMentioned || isReplyToBot;
}

function isAdminTakenOverChannel(channelId: string): boolean {
  const timestamp = adminTakenOver.get(channelId);
  if (!timestamp) return false;
  if (Date.now() - timestamp > TAKEOVER_COOLDOWN) {
    adminTakenOver.delete(channelId);
    return false;
  }
  return true;
}

export async function handleMessage(message: Message) {
  if (message.author.bot) return;

  // Aydo easter egg — always fires regardless of anything else
  if (mentionsAydo(message.content)) {
    await message.reply('daddy 😏');
    return;
  }

  // If an admin writes and the bot has spoken recently, mark channel as taken over
  if (isAdmin(message)) {
    const recentBotMessage = message.channel.messages.cache.find(
      m => m.author.id === message.client.user?.id && Date.now() - m.createdTimestamp < 60_000
    );
    if (recentBotMessage) {
      adminTakenOver.set(message.channelId, Date.now());
    } else if (isAdminTakenOverChannel(message.channelId)) {
      // Refresh the takeover timer while admin is still active
      adminTakenOver.set(message.channelId, Date.now());
    }
    return;
  }

  if (!shouldAIRespond(message)) return;
  if (isAdminTakenOverChannel(message.channelId)) return;

  const channelId = message.channelId;
  const history = conversationHistories.get(channelId) || [];

  try {
    await message.channel.sendTyping();

    const userContent = message.content.replace(/<@!?\d+>/g, '').trim();
    if (!userContent) return;

    const { response, needsAdmin } = await getAIResponse(userContent, history);

    history.push({ role: 'user', content: userContent });
    history.push({ role: 'assistant', content: response });
    if (history.length > 20) history.splice(0, history.length - 20);
    conversationHistories.set(channelId, history);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setDescription(response)
      .setFooter({ text: 'CheatGuard AI' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    if (needsAdmin) {
      const adminRole = message.guild?.roles.cache.find(
        r => r.name.toLowerCase() === CONFIG.ADMIN_ROLE_NAME.toLowerCase()
      );
      if (adminRole) {
        await message.channel.send(
          `${adminRole} — Admin assistance needed here. The AI will step back until an admin responds.`
        );
      } else {
        await message.channel.send(
          'An admin has been called to assist. The AI will step back until staff responds.'
        );
      }
    }
  } catch (error) {
    console.error('Message handler error:', error);
  }
}
