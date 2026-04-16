import OpenAI from 'openai';

const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

const openai =
  apiKey
    ? new OpenAI({
        baseURL,
        apiKey,
      })
    : null;

const SYSTEM_PROMPT = `You are CheatGuard AI, a helpful assistant for a gaming community Discord server focused on cheat detection and fair play.

Your responsibilities:
- Answer questions about the server, its rules, and gaming in general
- Help users understand anti-cheat systems and fair play policies
- Provide helpful information about gaming, mods (legitimate ones), and server features
- Be friendly, professional, and concise
- You speak both English and German fluently. Respond in the same language the user writes in.
- If someone writes in German, respond in German. If in English, respond in English.

Important rules:
- If you cannot answer a question or the topic is beyond your knowledge (e.g., specific account issues, ban appeals, technical server problems, payment issues), indicate that you need admin help.
- When you need admin help, include the exact phrase "[NEEDS_ADMIN]" at the end of your response.
- Be helpful but never share sensitive information.
- Keep responses concise and relevant.
- Do not pretend to have access to user data, ban records, or server configurations you don't have.`;

export async function getAIResponse(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ response: string; needsAdmin: boolean }> {
  try {
    if (!openai) {
      return {
        response: 'AI is not configured right now.',
        needsAdmin: false,
      };
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages,
      max_completion_tokens: 1024,
    });

    const response =
      completion.choices[0]?.message?.content ||
      'I could not generate a response.';

    const needsAdmin = response.includes('[NEEDS_ADMIN]');
    const cleanResponse = response.replace('[NEEDS_ADMIN]', '').trim();

    return {
      response: cleanResponse,
      needsAdmin,
    };
  } catch (error) {
    console.error('AI response error:', error);
    return {
      response: 'I am currently having trouble processing your request. Please try again later.',
      needsAdmin: false,
    };
  }
}
