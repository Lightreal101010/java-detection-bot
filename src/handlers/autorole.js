import { GuildMember } from 'discord.js';

export async function handleAutoRole(member: GuildMember) {
  try {
    await member.roles.add('1494121818854785034');
    console.log(`Auto role added to ${member.user.tag}`);
  } catch (err) {
    console.error(err);
  }
}
