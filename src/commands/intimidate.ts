import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleTrack(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  await interaction.deferReply();
  await new Promise(r => setTimeout(r, 2000));

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('🛰️ TRACKING INITIATED')
    .setDescription(`**Target acquired:** ${user}`)
    .addFields(
      { name: 'Status', value: '🔴 ACTIVE MONITORING', inline: true },
      { name: 'Data Collection', value: '█████████░ 90%', inline: true },
      { name: 'Activity Log', value: 'Message patterns archived\nVoice channel activity logged\nJoin/leave history captured', inline: false },
      { name: 'Alert Level', value: '🚨 HIGH — Staff has been notified', inline: false },
    )
    .setFooter({ text: 'CheatGuard Surveillance System v3.1 • All activity is logged' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

export async function handleExpose(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'Server only.', ephemeral: true });

  await interaction.deferReply();
  await new Promise(r => setTimeout(r, 1500));

  const member = await guild.members.fetch(user.id).catch(() => null);
  const accountAge = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));
  const joinedDaysAgo = member?.joinedAt
    ? Math.floor((Date.now() - member.joinedAt.getTime()) / (1000 * 60 * 60 * 24))
    : '?';

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(`🔍 EXPOSURE REPORT — ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: 'Discord ID', value: `\`${user.id}\``, inline: true },
      { name: 'Account Age', value: `${accountAge} days`, inline: true },
      { name: 'Server Presence', value: `${joinedDaysAgo} days`, inline: true },
      { name: 'Profile Type', value: user.avatarURL() ? 'Custom avatar' : '⚠️ No avatar (suspicious)', inline: true },
      { name: 'Bot Detection', value: user.bot ? '🤖 IS A BOT' : '✅ Human', inline: true },
      { name: 'Verdict', value: accountAge < 30 ? '🚨 NEW ACCOUNT — HIGH RISK' : '⚠️ Under observation', inline: false },
    )
    .setFooter({ text: `Exposed by ${interaction.user.tag} • This report has been archived` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

export async function handleWatchlist(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  await interaction.deferReply();
  await new Promise(r => setTimeout(r, 1000));

  const embed = new EmbedBuilder()
    .setColor(0xff6600)
    .setTitle('👁️ WATCHLIST — User Added')
    .setDescription(`${user} has been placed under active surveillance.`)
    .addFields(
      { name: 'Monitoring Level', value: 'MAXIMUM', inline: true },
      { name: 'Alert Threshold', value: 'All messages flagged', inline: true },
      { name: 'Duration', value: 'Indefinite', inline: true },
      { name: 'Notice', value: 'Any further rule violations will result in immediate action. Staff has been notified.', inline: false },
    )
    .setFooter({ text: 'CheatGuard Watchlist System • Permanent record created' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

export async function handleEvidence(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const details = interaction.options.getString('details', true);

  const embed = new EmbedBuilder()
    .setColor(0xcc0000)
    .setTitle('📁 EVIDENCE FILE CREATED')
    .addFields(
      { name: 'Subject', value: `${user.tag} \`${user.id}\``, inline: true },
      { name: 'Filed by', value: `${interaction.user.tag}`, inline: true },
      { name: 'Case Status', value: '🔴 OPEN', inline: true },
      { name: 'Evidence Summary', value: details },
      { name: 'Next Steps', value: 'Evidence has been archived. Admins have been alerted. This file is permanent.', inline: false },
    )
    .setFooter({ text: `Case ID: ${Date.now()} • CheatGuard Evidence System` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
