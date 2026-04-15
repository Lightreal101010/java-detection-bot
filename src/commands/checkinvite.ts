import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

const SUSPICIOUS_KEYWORDS = [
  'cheat', 'hack', 'exploit', 'crack', 'bypass', 'spoof', 'aimbot',
  'wallhack', 'esp', 'modmenu', 'inject', 'free', 'nitro', 'giveaway',
  'adult', 'nsfw', 'porn', 'money', 'cash', 'crypto', 'nft',
];

function extractInviteCode(input: string): string | null {
  const match = input.match(/(?:discord\.gg\/|discord\.com\/invite\/)([a-zA-Z0-9-]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-]+$/.test(input.trim())) return input.trim();
  return null;
}

export async function handleCheckInvite(interaction: ChatInputCommandInteraction) {
  const input = interaction.options.getString('invite', true);
  const code = extractInviteCode(input);

  if (!code) {
    return interaction.reply({ content: 'Invalid invite link or code.', ephemeral: true });
  }

  await interaction.deferReply();

  try {
    const invite = await interaction.client.fetchInvite(code);
    const guild = invite.guild;
    const flags: string[] = [];

    if (!guild) {
      return interaction.editReply('Could not retrieve guild information from this invite.');
    }

    const name = guild.name.toLowerCase();
    for (const kw of SUSPICIOUS_KEYWORDS) {
      if (name.includes(kw)) {
        flags.push(`Server name contains suspicious keyword: **${kw}**`);
      }
    }

    const desc = (guild.description || '').toLowerCase();
    for (const kw of SUSPICIOUS_KEYWORDS) {
      if (desc.includes(kw)) {
        flags.push(`Server description contains suspicious keyword: **${kw}**`);
      }
    }

    if (invite.memberCount && invite.memberCount < 10) {
      flags.push('Very small server (fewer than 10 members)');
    }

    if (guild.verificationLevel === 0) {
      flags.push('No verification level set');
    }

    const riskLevel = flags.length >= 2 ? 'HIGH' : flags.length === 1 ? 'MEDIUM' : 'LOW';
    const riskColor = riskLevel === 'HIGH' ? 0xff0000 : riskLevel === 'MEDIUM' ? 0xffaa00 : 0x00ff00;

    const embed = new EmbedBuilder()
      .setColor(riskColor)
      .setTitle(`Invite Scan: discord.gg/${code}`)
      .setThumbnail(guild.iconURL() || '')
      .addFields(
        { name: 'Server Name', value: guild.name, inline: true },
        { name: 'Members', value: `${invite.memberCount ?? 'Unknown'}`, inline: true },
        { name: 'Risk Level', value: `**${riskLevel}**`, inline: true },
        {
          name: 'Flags',
          value: flags.length > 0 ? flags.map(f => `- ${f}`).join('\n') : 'No suspicious flags detected.',
        },
      )
      .setFooter({ text: `Scanned by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch {
    await interaction.editReply('Could not fetch that invite. It may be invalid or expired.');
  }
}
