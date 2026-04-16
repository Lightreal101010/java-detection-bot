import { GuildMember } from 'discord.js';

const AUTO_ROLE_ID = '1494121818854785034';

export async function handleAutoRole(member: GuildMember) {
  try {
    console.log(`New member joined: ${member.user.tag}`);

    const role = await member.guild.roles.fetch(AUTO_ROLE_ID).catch(() => null);

    if (!role) {
      console.error(`Auto role not found: ${AUTO_ROLE_ID}`);
      return;
    }

    if (member.roles.cache.has(AUTO_ROLE_ID)) {
      console.log(`${member.user.tag} already has the auto role`);
      return;
    }

    await member.roles.add(AUTO_ROLE_ID);
    console.log(`Auto role added to ${member.user.tag}`);
  } catch (error) {
    console.error('Failed to add auto role:', error);
  }
}
