import { GuildMember } from 'discord.js';

const AUTO_ROLE_ID = '1494121818854785034';

export async function handleAutoRole(member: GuildMember) {
  try {
    const role = await member.guild.roles.fetch(AUTO_ROLE_ID).catch(() => null);

    if (!role) {
      console.error(`Auto role ${AUTO_ROLE_ID} not found`);
      return;
    }

    await member.roles.add(role).catch((error) => {
      console.error('Failed to add auto role:', error);
    });
  } catch (error) {
    console.error('Auto role handler error:', error);
  }
}
