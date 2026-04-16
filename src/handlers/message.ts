import { Message } from 'discord.js';
import { getAIResponse } from '../services/ai.js';

const conversationMemory = new Map<
  string,
  { role: 'user' | 'assistant'; content: string }[]
>();

export async function handleMessage(message: Message) {
  try {
    // ❌ Bots ignorieren
    if (message.author.bot) return;

    // ❌ Leere Nachrichten ignorieren
    if (!message.content) return;

    const channel = message.channel;

    // 🔥 FIX: TypeScript Safe Check
    if (!channel.isSendable()) {
      console.log('Channel not sendable:', channel.type);
      return;
    }

    // 🔄 Conversation speichern (pro User)
    const userId = message.author.id;
    const history = conversationMemory.get(userId) || [];

    // Neue User Nachricht speichern
    history.push({
      role: 'user',
      content: message.content,
    });

    // Max 10 Nachrichten behalten
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    // ⏳ Typing anzeigen
    await channel.sendTyping();

    // 🤖 AI Antwort holen
    const ai = await getAIResponse(message.content, history);

    // AI Antwort speichern
    history.push({
      role: 'assistant',
      content: ai.response,
    });

    conversationMemory.set(userId, history);

    // 📩 Antwort senden
    await channel.send(ai.response);

    // 🚨 Falls Admin benötigt wird
    if (ai.needsAdmin) {
      await channel.send('⚠️ Ein Admin wird benötigt.');
    }
  } catch (error) {
    console.error('Message handler error:', error);
  }
}
