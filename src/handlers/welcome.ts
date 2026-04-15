import { GuildMember, EmbedBuilder } from 'discord.js';

export async function handleGuildMemberAdd(member: GuildMember) {
  const channel = member.guild.systemChannel;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Welcome!')
    .setDescription(`Welcome to **${member.guild.name}**, ${member}! You are member #${member.guild.memberCount}.`)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => {});
}
