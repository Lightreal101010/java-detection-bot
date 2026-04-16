import { GuildMember } from 'discord.js';

const AUTO_ROLE_ID = '1494121818854785034';

export async function handleAutoRole(member: GuildMember) {
  try {
    await member.roles.add(AUTO_ROLE_ID);
    console.log(`Auto role added to ${member.user.tag}`);
  } catch (error) {
    console.error('Failed to add auto role:', error);
  }
}
