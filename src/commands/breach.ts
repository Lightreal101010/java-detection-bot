import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function randomDigits(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function fakeToken(): string {
  // Realistic Discord token: Base64(user_id).timestamp_b64.hmac
  const userId = randomDigits(18);
  const part1 = Buffer.from(userId).toString('base64').replace(/=/g, '');
  const epoch = Math.floor((Date.now() - 1293840000000) / 1000);
  const part2 = Buffer.from(epoch.toString()).toString('base64').replace(/=/g, '').slice(0, 6);
  const part3 = Buffer.from(randomHex(20)).toString('base64').replace(/=/g, '').slice(0, 27);
  return `${part1}.${part2}.${part3}`;
}

function fakeIp(): string {
  const ranges = ['78', '91', '185', '194', '212', '37', '45', '5'];
  const a = ranges[Math.floor(Math.random() * ranges.length)];
  return `${a}.${randomDigits(3)}.${randomDigits(2)}.${randomDigits(3)}`;
}

function fakeHwid(): string {
  return [
    randomHex(8),
    randomHex(4),
    randomHex(4),
    randomHex(4),
    randomHex(12),
  ].join('-').toUpperCase();
}

export async function handleBreach(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  await interaction.deferReply({ ephemeral: true });

  const token = fakeToken();
  const caseId = `JAVA-${randomHex(3).toUpperCase()}${randomDigits(4)}`;
  const ip = fakeIp();
  const hwid = fakeHwid();
  const sessionHash = randomHex(64).toUpperCase();
  const buildVersion = `${randomDigits(1)}.${randomDigits(1)}.${randomDigits(4)}`;
  const timestamp = new Date().toUTCString();
  const injectOffset = `0x${randomHex(8).toUpperCase()}`;

  const dmContent = [
    '```ansi',
    '\u001b[2;31m┌─────────────────────────────────────────────────────┐\u001b[0m',
    '\u001b[2;31m│\u001b[0m  \u001b[1;33mJAVA DETECTION SYSTEMS\u001b[0m  \u001b[2;37m//\u001b[0m  \u001b[1;31mSECURITY ALERT\u001b[0m          \u001b[2;31m│\u001b[0m',
    '\u001b[2;31m│\u001b[0m  \u001b[2;37mAutomated Enforcement Module — v3.8.1\u001b[0m              \u001b[2;31m│\u001b[0m',
    '\u001b[2;31m└─────────────────────────────────────────────────────┘\u001b[0m',
    '',
    `\u001b[1;37m[+]\u001b[0m \u001b[1;32mTarget resolved\u001b[0m        ${user.id}`,
    `\u001b[1;37m[+]\u001b[0m \u001b[1;32mSession captured\u001b[0m       ${sessionHash.slice(0, 32)}`,
    `\u001b[1;37m[+]\u001b[0m \u001b[1;32mIP address logged\u001b[0m      ${ip}`,
    `\u001b[1;37m[+]\u001b[0m \u001b[1;32mHWID fingerprint\u001b[0m       ${hwid}`,
    `\u001b[1;37m[+]\u001b[0m \u001b[1;32mBuild version\u001b[0m          ${buildVersion}`,
    `\u001b[1;37m[+]\u001b[0m \u001b[1;32mMemory offset\u001b[0m          ${injectOffset}`,
    '',
    `\u001b[1;31m[!]\u001b[0m \u001b[1;31mCREDENTIAL SNAPSHOT EXTRACTED\u001b[0m`,
    `\u001b[2;37m    ${token}\u001b[0m`,
    '',
    `\u001b[2;37m    Case   : ${caseId}\u001b[0m`,
    `\u001b[2;37m    Logged : ${timestamp}\u001b[0m`,
    `\u001b[2;37m    Status : ACTIVE — PENDING REVIEW\u001b[0m`,
    '\u001b[2;31m─────────────────────────────────────────────────────\u001b[0m',
    '```',
    '',
    '**You have been flagged by the Java Detection System.**',
    '',
    'Your account was identified during an automated enforcement sweep. The snapshot above has been archived and forwarded to our moderation team.',
    '',
    '> ⚠️ Any further violations will result in immediate permanent action.',
    '> A staff member will reach out regarding case `' + caseId + '`.',
    '',
    '-# Java Automated Enforcement · Do not reply to this message',
  ].join('\n');

  try {
    await user.send(dmContent);

    const confirmEmbed = new EmbedBuilder()
      .setColor(0x1a0000)
      .setTitle('📡 BREACH EXECUTED')
      .addFields(
        { name: 'Target', value: `${user.tag} \`${user.id}\``, inline: true },
        { name: 'Case', value: caseId, inline: true },
        { name: 'IP Logged', value: ip, inline: true },
        { name: 'HWID', value: `\`${hwid}\``, inline: false },
        { name: 'Token Snapshot', value: `\`\`\`${token}\`\`\`` },
        { name: 'Status', value: '✅ DM delivered', inline: true },
      )
      .setFooter({ text: `Executed by ${interaction.user.tag} • ${timestamp}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [confirmEmbed] });
  } catch {
    await interaction.editReply({
      content: `Could not DM **${user.tag}**. They may have DMs disabled or have blocked the bot.`,
    });
  }
}
