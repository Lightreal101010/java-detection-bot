import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

export type BotCommand = {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cachedCommands = new Map<string, BotCommand>();

export async function loadSlashCommands() {
  cachedCommands.clear();

  const files = fs
    .readdirSync(__dirname)
    .filter(
      (file) =>
        file.endsWith('.js') &&
        !['register.js', 'registry.js'].includes(file),
    );

  const json: ReturnType<BotCommand['data']['toJSON']>[] = [];

  for (const file of files) {
    const fullPath = path.join(__dirname, file);
    const mod = await import(pathToFileURL(fullPath).href);

    const command: BotCommand | undefined =
      mod.default ?? mod.command ?? undefined;

    if (!command?.data || typeof command.execute !== 'function') {
      console.warn(`Skipped command file: ${file}`);
      continue;
    }

    cachedCommands.set(command.data.name, command);
    json.push(command.data.toJSON());
  }

  return {
    json,
    commands: cachedCommands,
  };
}

export function getSlashCommand(name: string) {
  return cachedCommands.get(name);
}

export function getAllLoadedCommands() {
  return cachedCommands;
}
